package com.solagroup.viral

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.media3.transformer.Effects
import androidx.media3.common.MediaItem
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.StaticOverlaySettings
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import java.io.File
import java.nio.ByteBuffer
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class VideoTrimmerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "VideoTrimmerModule"

  @ReactMethod
  fun trimVideo(uri: String, startMs: Double, endMs: Double, promise: Promise) {
    if (uri.isBlank()) {
      promise.reject("invalid_uri", "Missing uri.")
      return
    }

    val startUsRequested = (startMs * 1000.0).toLong()
    val endUs = (endMs * 1000.0).toLong()
    if (endUs <= startUsRequested) {
      promise.reject("invalid_range", "Invalid trim range.")
      return
    }

    val outputFile = File(reactContext.cacheDir, "trim_${System.currentTimeMillis()}.mp4")

    try {
      val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      val trackMap = mutableMapOf<Int, Int>()
      val trackFormats = mutableMapOf<Int, android.media.MediaFormat>()

      val extractor = MediaExtractor()
      try {
        setExtractorDataSource(extractor, uri)

        for (i in 0 until extractor.trackCount) {
          val format = extractor.getTrackFormat(i)
          val mime = format.getString(android.media.MediaFormat.KEY_MIME) ?: continue
          if (!mime.startsWith("video/") && !mime.startsWith("audio/")) continue
          val dstIndex = muxer.addTrack(format)
          trackMap[i] = dstIndex
          trackFormats[i] = format
        }
      } finally {
        extractor.release()
      }

      muxer.start()

      val bufferSize = (trackFormats.values.maxOfOrNull { f ->
        if (f.containsKey(android.media.MediaFormat.KEY_MAX_INPUT_SIZE)) {
          f.getInteger(android.media.MediaFormat.KEY_MAX_INPUT_SIZE)
        } else {
          0
        }
      } ?: 0).coerceAtLeast(1024 * 1024)

      val buffer = ByteBuffer.allocateDirect(bufferSize)
      val info = MediaCodec.BufferInfo()

      for ((srcTrackIndex, dstTrackIndex) in trackMap) {
        val extractor = MediaExtractor()
        try {
          setExtractorDataSource(extractor, uri)
          extractor.selectTrack(srcTrackIndex)
          extractor.seekTo(startUsRequested, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

          var firstPtsUs: Long? = null
          while (true) {
            info.offset = 0
            info.size = extractor.readSampleData(buffer, 0)
            if (info.size < 0) break

            val sampleTimeUs = extractor.sampleTime
            if (sampleTimeUs < 0) break
            if (sampleTimeUs > endUs) break

            if (firstPtsUs == null) firstPtsUs = sampleTimeUs
            info.presentationTimeUs = sampleTimeUs - (firstPtsUs ?: sampleTimeUs)
            info.flags = extractor.sampleFlags

            muxer.writeSampleData(dstTrackIndex, buffer, info)
            extractor.advance()
          }
        } finally {
          extractor.release()
        }
      }

      muxer.stop()
      muxer.release()

      promise.resolve(mapOf("uri" to "file://${outputFile.absolutePath}"))
    } catch (t: Throwable) {
      if (outputFile.exists()) {
        try {
          outputFile.delete()
        } catch (_: Throwable) {
        }
      }
      promise.reject("trim_failed", "Trim failed.", t)
    }
  }

  @ReactMethod
  fun trimVideoWithOverlay(uri: String, startMs: Double, endMs: Double, overlay: ReadableMap, promise: Promise) {
    if (uri.isBlank()) {
      promise.reject("invalid_uri", "Missing uri.")
      return
    }

    val startMsLong = max(0L, floor(startMs).toLong())
    val endMsLong = max(startMsLong, floor(endMs).toLong())
    if (endMsLong <= startMsLong) {
      promise.reject("invalid_range", "Invalid trim range.")
      return
    }

    val overlayList: List<ReadableMap> = run {
      val arr: ReadableArray? = overlay.getArray("overlays")
      if (arr != null) {
        val out = ArrayList<ReadableMap>(arr.size())
        for (i in 0 until arr.size()) {
          val m = arr.getMap(i)
          if (m != null) out.add(m)
        }
        out
      } else {
        listOf(overlay)
      }
    }

    if (overlayList.none { (it.getString("text") ?: "").isNotBlank() }) {
      trimVideo(uri, startMs, endMs, promise)
      return
    }

    val outputFile = File(reactContext.cacheDir, "trim_overlay_${System.currentTimeMillis()}.mp4")
    if (outputFile.exists()) {
      try { outputFile.delete() } catch (_: Throwable) {}
    }

    val inputUri = Uri.parse(uri)
    val retriever = MediaMetadataRetriever()
    try {
      if (uri.startsWith("file://")) {
        retriever.setDataSource(uri.removePrefix("file://"))
      } else {
        retriever.setDataSource(reactContext, inputUri)
      }

      val w = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
      val h = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
      val rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
      val videoW = if (rotation == 90 || rotation == 270) h else w
      val videoH = if (rotation == 90 || rotation == 270) w else h
      if (videoW <= 0 || videoH <= 0) {
        promise.reject("invalid_asset", "Invalid video metadata.")
        return
      }
      val bitmapOverlays = overlayList.mapNotNull { ov ->
        val text = ov.getString("text") ?: ""
        if (text.isBlank()) return@mapNotNull null

        val containerW = ov.getDouble("containerWidth").toFloat()
        val containerH = ov.getDouble("containerHeight").toFloat()
        val left = ov.getDouble("left").toFloat()
        val top = ov.getDouble("top").toFloat()
        val width = ov.getDouble("width").toFloat()
        val height = ov.getDouble("height").toFloat()
        if (containerW <= 0f || containerH <= 0f || width <= 1f || height <= 1f) return@mapNotNull null

        val scaleDisplay = max(containerW / videoW.toFloat(), containerH / videoH.toFloat())
        val offsetX = (containerW - videoW * scaleDisplay) / 2f
        val offsetY = (containerH - videoH * scaleDisplay) / 2f

        val rectX = (left - offsetX) / scaleDisplay
        val rectY = (top - offsetY) / scaleDisplay
        val rectW = width / scaleDisplay
        val rectH = height / scaleDisplay

        val clampedX = rectX.coerceIn(0f, max(0f, videoW - 1f))
        val clampedY = rectY.coerceIn(0f, max(0f, videoH - 1f))
        val clampedW = rectW.coerceIn(1f, max(1f, videoW - clampedX))
        val clampedH = rectH.coerceIn(1f, max(1f, videoH - clampedY))

        val bmpW = clampedW.roundToInt().coerceAtLeast(1).coerceAtMost(2048)
        val bmpH = clampedH.roundToInt().coerceAtLeast(1).coerceAtMost(2048)

        val bitmap = Bitmap.createBitmap(bmpW, bmpH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val hasBackground = ov.getBoolean("hasBackground")
        val bgColor = parseColor(ov.getString("backgroundColor"))
        val textColor = parseColor(ov.getString("color"))
        val textAlign = ov.getString("textAlign") ?: "center"
        val fontStyle = ov.getString("fontStyle") ?: "normal"
        val fontWeight = ov.getString("fontWeight") ?: "400"
        val textDecoration = ov.getString("textDecoration") ?: "none"

        val textScale = (ov.getDouble("textScale").toFloat()).takeIf { it > 0f } ?: 1f
        val fontSize = ov.getDouble("fontSize").toFloat()
        val paddingH = ov.getDouble("paddingHorizontal").toFloat()
        val paddingV = ov.getDouble("paddingVertical").toFloat()
        val paddingBottom = ov.getDouble("paddingBottom").toFloat()
        val cornerRadius = ov.getDouble("cornerRadius").toFloat()

        val uiToVideo = textScale / scaleDisplay
        val textSizePx = max(1f, fontSize * uiToVideo)
        val padLeftPx = max(0f, paddingH * uiToVideo)
        val padTopPx = max(0f, paddingV * uiToVideo)
        val padBottomPx = max(0f, paddingBottom * uiToVideo)
        val cornerPx = max(0f, cornerRadius * uiToVideo)

        if (hasBackground) {
          val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = bgColor
          }
          canvas.drawRoundRect(0f, 0f, bmpW.toFloat(), bmpH.toFloat(), cornerPx, cornerPx, bgPaint)
        }

        val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
          color = textColor
          textSize = textSizePx
          isUnderlineText = textDecoration.contains("underline")
          isStrikeThruText = textDecoration.contains("line-through")
          isFakeBoldText = fontWeight == "700"
          textSkewX = if (fontStyle == "italic") -0.25f else 0f
        }

        val contentW = max(0f, bmpW - 2f * padLeftPx).roundToInt()
        val contentH = max(0f, bmpH - padTopPx - padBottomPx).roundToInt()
        if (contentW > 0 && contentH > 0) {
          val alignment = when (textAlign) {
            "left" -> Layout.Alignment.ALIGN_NORMAL
            "right" -> Layout.Alignment.ALIGN_OPPOSITE
            else -> Layout.Alignment.ALIGN_CENTER
          }
          val staticLayout = StaticLayout.Builder
            .obtain(text, 0, text.length, textPaint, contentW)
            .setAlignment(alignment)
            .setIncludePad(false)
            .build()
          canvas.save()
          canvas.translate(padLeftPx, padTopPx)
          staticLayout.draw(canvas)
          canvas.restore()
        }

        val anchorNdcX = (clampedX / videoW.toFloat()) * 2f - 1f
        val anchorNdcY = 1f - (clampedY / videoH.toFloat()) * 2f

        val overlaySettings = StaticOverlaySettings.Builder()
          .setOverlayFrameAnchor(-1f, 1f)
          .setBackgroundFrameAnchor(anchorNdcX.coerceIn(-1f, 1f), anchorNdcY.coerceIn(-1f, 1f))
          .build()

        BitmapOverlay.createStaticBitmapOverlay(bitmap, overlaySettings)
      }

      if (bitmapOverlays.isEmpty()) {
        trimVideo(uri, startMs, endMs, promise)
        return
      }

      val overlayEffect = OverlayEffect(bitmapOverlays)
      val effects = Effects(emptyList(), listOf(overlayEffect))

      val clipping = MediaItem.ClippingConfiguration.Builder()
        .setStartPositionMs(startMsLong)
        .setEndPositionMs(endMsLong)
        .build()

      val mediaItem = MediaItem.Builder()
        .setUri(inputUri)
        .setClippingConfiguration(clipping)
        .build()

      val editedMediaItem = androidx.media3.transformer.EditedMediaItem.Builder(mediaItem)
        .setEffects(effects)
        .build()

      val transformer = Transformer.Builder(reactContext)
        .addListener(object : Transformer.Listener {
          override fun onCompleted(composition: androidx.media3.transformer.Composition, exportResult: ExportResult) {
            val resolved = Arguments.createMap().apply {
              putString("uri", "file://${outputFile.absolutePath}")
            }
            promise.resolve(resolved)
          }

          override fun onError(
            composition: androidx.media3.transformer.Composition,
            exportResult: ExportResult,
            exportException: ExportException
          ) {
            promise.reject("export_failed", "Export failed.", exportException)
          }
        })
        .build()

      transformer.start(editedMediaItem, outputFile.absolutePath)
    } catch (t: Throwable) {
      if (outputFile.exists()) {
        try { outputFile.delete() } catch (_: Throwable) {}
      }
      promise.reject("export_failed", "Export failed.", t)
    } finally {
      try { retriever.release() } catch (_: Throwable) {}
    }
  }

  private fun setExtractorDataSource(extractor: MediaExtractor, uri: String) {
    if (uri.startsWith("file://")) {
      extractor.setDataSource(uri.removePrefix("file://"))
      return
    }

    val parsed = Uri.parse(uri)
    val pfd = reactContext.contentResolver.openFileDescriptor(parsed, "r")
    if (pfd != null) {
      extractor.setDataSource(pfd.fileDescriptor)
      pfd.close()
      return
    }

    extractor.setDataSource(uri)
  }

  private fun parseColor(hex: String?): Int {
    if (hex == null || hex.isBlank()) return 0xFFFFFFFF.toInt()
    var s = hex.trim()
    if (s.startsWith("#")) s = s.substring(1)
    return try {
      when (s.length) {
        6 -> (0xFF000000 or s.toLong(16)).toInt()
        8 -> s.toLong(16).toInt()
        else -> 0xFFFFFFFF.toInt()
      }
    } catch (_: Throwable) {
      0xFFFFFFFF.toInt()
    }
  }
}
