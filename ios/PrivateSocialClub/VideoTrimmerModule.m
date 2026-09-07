#import <AVFoundation/AVFoundation.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <math.h>

@interface VideoTrimmerModule : NSObject <RCTBridgeModule>
@end

@implementation VideoTrimmerModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

static UIColor *VTColorFromHex(NSString *hex, UIColor *fallback) {
  if (![hex isKindOfClass:[NSString class]] || hex.length == 0) {
    return fallback;
  }
  NSString *s = [[hex
      stringByTrimmingCharactersInSet:[NSCharacterSet
                                          whitespaceAndNewlineCharacterSet]]
      uppercaseString];
  if ([s hasPrefix:@"#"]) {
    s = [s substringFromIndex:1];
  }
  if (s.length != 6 && s.length != 8) {
    return fallback;
  }
  unsigned int rgb = 0;
  NSScanner *scanner = [NSScanner scannerWithString:s];
  if (![scanner scanHexInt:&rgb]) {
    return fallback;
  }
  CGFloat a = 1.0;
  CGFloat r = 0, g = 0, b = 0;
  if (s.length == 6) {
    r = ((rgb & 0xFF0000) >> 16) / 255.0;
    g = ((rgb & 0x00FF00) >> 8) / 255.0;
    b = (rgb & 0x0000FF) / 255.0;
  } else {
    r = ((rgb & 0xFF000000) >> 24) / 255.0;
    g = ((rgb & 0x00FF0000) >> 16) / 255.0;
    b = ((rgb & 0x0000FF00) >> 8) / 255.0;
    a = (rgb & 0x000000FF) / 255.0;
  }
  return [UIColor colorWithRed:r green:g blue:b alpha:a];
}

static BOOL VTIsFinite(CGFloat v) { return isfinite((double)v); }

static void VTAddTextOverlayLayers(NSDictionary *overlay,
                                   CALayer *overlayContainer,
                                   CGRect overlayRectVideo,
                                   CGFloat scaleDisplay) {
  if (![overlay isKindOfClass:[NSDictionary class]] || !overlayContainer ||
      CGRectIsEmpty(overlayRectVideo) || overlayRectVideo.size.width <= 1 ||
      overlayRectVideo.size.height <= 1) {
    return;
  }

  NSString *text = [overlay[@"text"] isKindOfClass:[NSString class]]
                       ? overlay[@"text"]
                       : @"";
  if (text.length == 0) {
    return;
  }

  NSString *colorHex = [overlay[@"color"] isKindOfClass:[NSString class]]
                           ? overlay[@"color"]
                           : @"#FFFFFF";
  NSString *backgroundHex =
      [overlay[@"backgroundColor"] isKindOfClass:[NSString class]]
          ? overlay[@"backgroundColor"]
          : @"#000000";
  NSNumber *hasBackgroundNum =
      [overlay[@"hasBackground"] isKindOfClass:[NSNumber class]]
          ? overlay[@"hasBackground"]
          : @(NO);
  NSString *textAlign = [overlay[@"textAlign"] isKindOfClass:[NSString class]]
                            ? overlay[@"textAlign"]
                            : @"center";
  NSString *fontWeight = [overlay[@"fontWeight"] isKindOfClass:[NSString class]]
                             ? overlay[@"fontWeight"]
                             : @"400";
  NSString *fontStyle = [overlay[@"fontStyle"] isKindOfClass:[NSString class]]
                            ? overlay[@"fontStyle"]
                            : @"normal";
  NSString *textDecoration =
      [overlay[@"textDecoration"] isKindOfClass:[NSString class]]
          ? overlay[@"textDecoration"]
          : @"none";

  CGFloat textScale = [overlay[@"textScale"] isKindOfClass:[NSNumber class]]
                          ? [overlay[@"textScale"] doubleValue]
                          : 1.0;
  CGFloat fontSize = [overlay[@"fontSize"] isKindOfClass:[NSNumber class]]
                         ? [overlay[@"fontSize"] doubleValue]
                         : 16.0;
  CGFloat paddingH =
      [overlay[@"paddingHorizontal"] isKindOfClass:[NSNumber class]]
          ? [overlay[@"paddingHorizontal"] doubleValue]
          : 16.0;
  CGFloat paddingV =
      [overlay[@"paddingVertical"] isKindOfClass:[NSNumber class]]
          ? [overlay[@"paddingVertical"] doubleValue]
          : 14.0;
  CGFloat paddingBottom =
      [overlay[@"paddingBottom"] isKindOfClass:[NSNumber class]]
          ? [overlay[@"paddingBottom"] doubleValue]
          : 12.0;
  CGFloat cornerRadius =
      [overlay[@"cornerRadius"] isKindOfClass:[NSNumber class]]
          ? [overlay[@"cornerRadius"] doubleValue]
          : 22.0;

  CGFloat uiToVideo = (scaleDisplay > 0 ? (textScale / scaleDisplay) : 1.0);
  CGFloat videoFontSize = MAX(1.0, fontSize * uiToVideo);
  CGFloat videoPaddingH = MAX(0.0, paddingH * uiToVideo);
  CGFloat videoPaddingV = MAX(0.0, paddingV * uiToVideo);
  CGFloat videoPaddingBottom = MAX(0.0, paddingBottom * uiToVideo);
  CGFloat videoCornerRadius = MAX(0.0, cornerRadius * uiToVideo);

  __block UIColor *textColor = UIColor.whiteColor;
  __block UIColor *bgColor = UIColor.blackColor;
  __block UIFont *finalFont = nil;
  __block CGFloat layerContentScale = 1.0;

  void (^buildTypographyAndColors)(void) = ^{
    textColor = VTColorFromHex(colorHex, UIColor.whiteColor);
    bgColor = VTColorFromHex(backgroundHex, UIColor.blackColor);

    UIFontWeight weight = [fontWeight isEqualToString:@"700"]
                              ? UIFontWeightBold
                              : UIFontWeightRegular;
    UIFont *baseFont = [UIFont systemFontOfSize:videoFontSize weight:weight];
    finalFont = baseFont;
    if ([fontStyle isEqualToString:@"italic"]) {
      UIFontDescriptor *desc = [baseFont.fontDescriptor
          fontDescriptorWithSymbolicTraits:baseFont.fontDescriptor
                                               .symbolicTraits |
                                           UIFontDescriptorTraitItalic];
      if (desc) {
        finalFont =
            [UIFont fontWithDescriptor:desc size:videoFontSize] ?: baseFont;
      }
    }

    UIScreen *mainScreen = UIScreen.mainScreen;
    layerContentScale = (mainScreen ? mainScreen.scale : 1.0);
    if (!VTIsFinite(layerContentScale) || layerContentScale <= 0) {
      layerContentScale = 1.0;
    }
  };

  if (NSThread.isMainThread) {
    buildTypographyAndColors();
  } else {
    dispatch_sync(dispatch_get_main_queue(), buildTypographyAndColors);
  }

  if (!finalFont) {
    finalFont = [UIFont systemFontOfSize:videoFontSize weight:UIFontWeightRegular];
  }

  NSMutableParagraphStyle *ps = [NSMutableParagraphStyle new];
  ps.lineBreakMode = NSLineBreakByWordWrapping;
  if ([textAlign isEqualToString:@"left"]) {
    ps.alignment = NSTextAlignmentLeft;
  } else if ([textAlign isEqualToString:@"right"]) {
    ps.alignment = NSTextAlignmentRight;
  } else {
    ps.alignment = NSTextAlignmentCenter;
  }

  NSMutableDictionary *attrs = [@{
    NSFontAttributeName : finalFont,
    NSForegroundColorAttributeName : textColor,
    NSParagraphStyleAttributeName : ps
  } mutableCopy];

  if ([textDecoration containsString:@"underline"]) {
    attrs[NSUnderlineStyleAttributeName] = @(NSUnderlineStyleSingle);
  }
  if ([textDecoration containsString:@"line-through"]) {
    attrs[NSStrikethroughStyleAttributeName] = @(NSUnderlineStyleSingle);
  }

  if (hasBackgroundNum.boolValue) {
    CALayer *bgLayer = [CALayer layer];
    bgLayer.frame = overlayRectVideo;
    bgLayer.backgroundColor = bgColor.CGColor;
    bgLayer.cornerRadius = videoCornerRadius;
    [overlayContainer addSublayer:bgLayer];
  }

  CGRect textRect =
      CGRectMake(overlayRectVideo.origin.x + videoPaddingH,
                 overlayRectVideo.origin.y + videoPaddingV,
                 MAX(0, overlayRectVideo.size.width - 2 * videoPaddingH),
                 MAX(0, overlayRectVideo.size.height - videoPaddingV -
                            videoPaddingBottom));
  if (textRect.size.width <= 0 || textRect.size.height <= 0) {
    return;
  }

  CATextLayer *textLayer = [CATextLayer layer];
  textLayer.frame = textRect;
  textLayer.wrapped = YES;
  textLayer.alignmentMode =
      ps.alignment == NSTextAlignmentLeft
          ? kCAAlignmentLeft
          : (ps.alignment == NSTextAlignmentRight ? kCAAlignmentRight
                                                  : kCAAlignmentCenter);
  textLayer.contentsScale = layerContentScale;
  NSAttributedString *as = [[NSAttributedString alloc] initWithString:text
                                                           attributes:attrs];
  textLayer.string = as;
  [overlayContainer addSublayer:textLayer];
}

RCT_REMAP_METHOD(trimVideo,
                 trimVideoWithUri : (NSString *)uri startMs : (
                     nonnull NSNumber *)startMs endMs : (nonnull NSNumber *)
                     endMs resolver : (RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  if (uri.length == 0) {
    reject(@"invalid_uri", @"Missing uri.", nil);
    return;
  }

  NSURL *inputURL = [NSURL URLWithString:uri];
  if (!inputURL || !inputURL.isFileURL) {
    reject(@"invalid_uri", @"Only file:// URIs are supported.", nil);
    return;
  }

  double startSeconds = startMs.doubleValue / 1000.0;
  double endSeconds = endMs.doubleValue / 1000.0;
  if (endSeconds <= startSeconds) {
    reject(@"invalid_range", @"Invalid trim range.", nil);
    return;
  }

  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:inputURL options:nil];
  CMTime startTime = CMTimeMakeWithSeconds(startSeconds, 600);
  CMTime endTime = CMTimeMakeWithSeconds(endSeconds, 600);
  CMTimeRange timeRange = CMTimeRangeFromTimeToTime(startTime, endTime);

  NSString *fileName = [NSString
      stringWithFormat:@"trim_%lld.mp4",
                       (long long)(NSDate.date.timeIntervalSince1970 * 1000)];
  NSString *outputPath =
      [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
  NSURL *outputURL = [NSURL fileURLWithPath:outputPath];

  [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

  AVAssetExportSession *exporter = [[AVAssetExportSession alloc]
      initWithAsset:asset
         presetName:AVAssetExportPresetPassthrough];
  if (!exporter) {
    reject(@"export_init_failed", @"Failed to initialize exporter.", nil);
    return;
  }

  exporter.outputURL = outputURL;
  exporter.outputFileType = AVFileTypeMPEG4;
  exporter.timeRange = timeRange;
  exporter.shouldOptimizeForNetworkUse = YES;

  [exporter exportAsynchronouslyWithCompletionHandler:^{
    switch (exporter.status) {
    case AVAssetExportSessionStatusCompleted: {
      resolve(@{@"uri" : outputURL.absoluteString});
      break;
    }
    case AVAssetExportSessionStatusCancelled: {
      NSError *e = exporter.error
                       ?: [NSError errorWithDomain:@"VideoTrimmerModule"
                                              code:-2
                                          userInfo:nil];
      reject(@"export_cancelled", @"Export cancelled.", e);
      break;
    }
    default: {
      NSError *e = exporter.error
                       ?: [NSError errorWithDomain:@"VideoTrimmerModule"
                                              code:-1
                                          userInfo:nil];
      reject(@"export_failed", @"Export failed.", e);
      break;
    }
    }
  }];
}

RCT_REMAP_METHOD(
    trimVideoWithOverlay,
    trimVideoWithOverlayUri : (NSString *)uri startMs : (nonnull NSNumber *)
        startMs endMs : (nonnull NSNumber *)endMs overlay : (NSDictionary *)
            overlay resolver : (RCTPromiseResolveBlock)
                resolve rejecter : (RCTPromiseRejectBlock)reject) {
  if (uri.length == 0) {
    reject(@"invalid_uri", @"Missing uri.", nil);
    return;
  }

  if (![overlay isKindOfClass:[NSDictionary class]]) {
    reject(@"invalid_overlay", @"Overlay is missing or invalid.", nil);
    return;
  }

  NSArray *overlays = nil;
  id overlaysMaybe = overlay[@"overlays"];
  if ([overlaysMaybe isKindOfClass:[NSArray class]]) {
    overlays = (NSArray *)overlaysMaybe;
  } else {
    overlays = @[ overlay ];
  }

  NSURL *inputURL = [NSURL URLWithString:uri];
  if (!inputURL || !inputURL.isFileURL) {
    reject(@"invalid_uri", @"Only file:// URIs are supported.", nil);
    return;
  }

  double startSeconds = startMs.doubleValue / 1000.0;
  double endSeconds = endMs.doubleValue / 1000.0;
  if (endSeconds <= startSeconds) {
    reject(@"invalid_range", @"Invalid trim range.", nil);
    return;
  }

  @try {
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:inputURL options:nil];
    AVAssetTrack *videoTrack =
        [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    if (!videoTrack) {
      reject(@"invalid_asset", @"No video track found.", nil);
      return;
    }

    CMTime startTime = CMTimeMakeWithSeconds(startSeconds, 600);
    CMTime endTime = CMTimeMakeWithSeconds(endSeconds, 600);
    CMTimeRange trimRange = CMTimeRangeFromTimeToTime(startTime, endTime);

    AVMutableComposition *composition = [AVMutableComposition composition];
    NSError *insertError = nil;
    AVMutableCompositionTrack *compVideo =
        [composition addMutableTrackWithMediaType:AVMediaTypeVideo
                                 preferredTrackID:kCMPersistentTrackID_Invalid];
    [compVideo insertTimeRange:trimRange
                       ofTrack:videoTrack
                        atTime:kCMTimeZero
                         error:&insertError];
    if (insertError) {
      reject(@"trim_failed", @"Trim failed.", insertError);
      return;
    }
    compVideo.preferredTransform = videoTrack.preferredTransform;

    AVAssetTrack *audioTrack =
        [[asset tracksWithMediaType:AVMediaTypeAudio] firstObject];
    if (audioTrack) {
      AVMutableCompositionTrack *compAudio = [composition
          addMutableTrackWithMediaType:AVMediaTypeAudio
                      preferredTrackID:kCMPersistentTrackID_Invalid];
      [compAudio insertTimeRange:trimRange
                         ofTrack:audioTrack
                          atTime:kCMTimeZero
                           error:nil];
    }

    CGAffineTransform preferredTransform = videoTrack.preferredTransform;
    CGRect transformedRect = CGRectApplyAffineTransform(
        (CGRect){CGPointZero, videoTrack.naturalSize}, preferredTransform);
    CGSize renderSize = CGSizeMake(fabs(transformedRect.size.width),
                                   fabs(transformedRect.size.height));
    if (renderSize.width < 1 || renderSize.height < 1) {
      renderSize = videoTrack.naturalSize;
    }

    CGAffineTransform correctedTransform = CGAffineTransformConcat(
        preferredTransform,
        CGAffineTransformMakeTranslation(-transformedRect.origin.x,
                                         -transformedRect.origin.y));

    AVMutableVideoCompositionInstruction *instruction =
        [AVMutableVideoCompositionInstruction videoCompositionInstruction];
    instruction.timeRange = CMTimeRangeMake(kCMTimeZero, composition.duration);

    AVMutableVideoCompositionLayerInstruction *layerInstruction =
        [AVMutableVideoCompositionLayerInstruction
            videoCompositionLayerInstructionWithAssetTrack:compVideo];
    [layerInstruction setTransform:correctedTransform atTime:kCMTimeZero];
    instruction.layerInstructions = @[ layerInstruction ];

    AVMutableVideoComposition *videoComposition =
        [AVMutableVideoComposition videoComposition];
    videoComposition.instructions = @[ instruction ];
    videoComposition.renderSize = renderSize;
    Float64 fps =
        videoTrack.nominalFrameRate > 0 ? videoTrack.nominalFrameRate : 30.0;
    videoComposition.frameDuration = CMTimeMake(1, (int32_t)lrint(fps));

    CALayer *parentLayer = [CALayer layer];
    parentLayer.frame = CGRectMake(0, 0, renderSize.width, renderSize.height);
    CALayer *videoLayer = [CALayer layer];
    videoLayer.frame = parentLayer.bounds;
    CALayer *overlayContainer = [CALayer layer];
    overlayContainer.frame = parentLayer.bounds;

    for (id ov in overlays) {
      if (![ov isKindOfClass:[NSDictionary class]]) {
        continue;
      }
      NSDictionary *overlayDict = (NSDictionary *)ov;

      CGFloat containerW =
          [overlayDict[@"containerWidth"] isKindOfClass:[NSNumber class]]
              ? [overlayDict[@"containerWidth"] doubleValue]
              : 0;
      CGFloat containerH =
          [overlayDict[@"containerHeight"] isKindOfClass:[NSNumber class]]
              ? [overlayDict[@"containerHeight"] doubleValue]
              : 0;
      CGFloat left = [overlayDict[@"left"] isKindOfClass:[NSNumber class]]
                         ? [overlayDict[@"left"] doubleValue]
                         : 0;
      CGFloat top = [overlayDict[@"top"] isKindOfClass:[NSNumber class]]
                        ? [overlayDict[@"top"] doubleValue]
                        : 0;
      CGFloat width = [overlayDict[@"width"] isKindOfClass:[NSNumber class]]
                          ? [overlayDict[@"width"] doubleValue]
                          : 0;
      CGFloat height = [overlayDict[@"height"] isKindOfClass:[NSNumber class]]
                           ? [overlayDict[@"height"] doubleValue]
                           : 0;

      if (containerW <= 0 || containerH <= 0 || width <= 1 || height <= 1) {
        continue;
      }

      CGFloat scaleDisplay = 1.0;
      CGFloat offsetX = 0;
      CGFloat offsetY = 0;
      if (renderSize.width > 0 && renderSize.height > 0) {
        scaleDisplay =
            MAX(containerW / renderSize.width, containerH / renderSize.height);
        offsetX = (containerW - renderSize.width * scaleDisplay) / 2.0;
        offsetY = (containerH - renderSize.height * scaleDisplay) / 2.0;
      }

      CGRect overlayRectVideo = CGRectZero;
      if (scaleDisplay > 0) {
        CGRect overlayRectUi = CGRectMake(
            (left - offsetX) / scaleDisplay, (top - offsetY) / scaleDisplay,
            width / scaleDisplay, height / scaleDisplay);
        overlayRectUi =
            CGRectIntersection(overlayRectUi, (CGRect){CGPointZero, renderSize});
        overlayRectVideo =
            CGRectMake(overlayRectUi.origin.x,
                       renderSize.height - overlayRectUi.origin.y -
                           overlayRectUi.size.height,
                       overlayRectUi.size.width, overlayRectUi.size.height);
        overlayRectVideo = CGRectIntersection(
            overlayRectVideo, (CGRect){CGPointZero, renderSize});
      }

      if (!VTIsFinite(overlayRectVideo.origin.x) ||
          !VTIsFinite(overlayRectVideo.origin.y) ||
          !VTIsFinite(overlayRectVideo.size.width) ||
          !VTIsFinite(overlayRectVideo.size.height)) {
        overlayRectVideo = CGRectZero;
      }

      if (!CGRectIsEmpty(overlayRectVideo) && overlayRectVideo.size.width > 1 &&
          overlayRectVideo.size.height > 1) {
        VTAddTextOverlayLayers(overlayDict, overlayContainer, overlayRectVideo,
                               scaleDisplay);
      }
    }

    [parentLayer addSublayer:videoLayer];
    [parentLayer addSublayer:overlayContainer];
    videoComposition.animationTool = [AVVideoCompositionCoreAnimationTool
        videoCompositionCoreAnimationToolWithPostProcessingAsVideoLayer:
            videoLayer
                                                                inLayer:
                                                                    parentLayer];

    NSString *fileName = [NSString
        stringWithFormat:@"trim_overlay_%lld.mp4",
                         (long long)(NSDate.date.timeIntervalSince1970 * 1000)];
    NSString *outputPath =
        [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
    NSURL *outputURL = [NSURL fileURLWithPath:outputPath];
    [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

    AVAssetExportSession *exporter = [[AVAssetExportSession alloc]
        initWithAsset:composition
           presetName:AVAssetExportPresetHighestQuality];
    if (!exporter) {
      reject(@"export_init_failed", @"Failed to initialize exporter.", nil);
      return;
    }

    exporter.outputURL = outputURL;
    exporter.outputFileType = AVFileTypeMPEG4;
    exporter.shouldOptimizeForNetworkUse = YES;
    exporter.videoComposition = videoComposition;

    [exporter exportAsynchronouslyWithCompletionHandler:^{
      switch (exporter.status) {
      case AVAssetExportSessionStatusCompleted: {
        resolve(@{@"uri" : outputURL.absoluteString});
        break;
      }
      case AVAssetExportSessionStatusCancelled: {
        NSError *e = exporter.error
                         ?: [NSError errorWithDomain:@"VideoTrimmerModule"
                                                code:-2
                                            userInfo:nil];
        reject(@"export_cancelled", @"Export cancelled.", e);
        break;
      }
      default: {
        NSError *e = exporter.error
                         ?: [NSError errorWithDomain:@"VideoTrimmerModule"
                                                code:-1
                                            userInfo:nil];
        reject(@"export_failed", @"Export failed.", e);
        break;
      }
      }
    }];
  } @catch (NSException *e) {
    reject(@"export_failed", @"Export failed.",
           [NSError errorWithDomain:@"VideoTrimmerModule"
                               code:-3
                           userInfo:@{
                             NSLocalizedDescriptionKey : e.reason ?: @"Unknown"
                           }]);
  }
}

@end
