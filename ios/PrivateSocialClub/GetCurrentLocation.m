#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GetCurrentLocation, NSObject)

RCT_EXTERN_METHOD(getCurrentLocation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopLocationService:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isLocationPermissionGranted:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isLocationServicesEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
// ───────────────────────────────────────────────────────────────────────────
// PSCAccessibility — kept in this file because it is compiled into the app
// target (VideoTrimmerModule.m is not in the Xcode project).
// CustomSwitch draws the Figma "Show AX Label" marks (| / O) over the native
// switch. When Settings › Accessibility › Display & Text Size › On/Off Labels
// is on, iOS draws its own marks too and they double up — this lets JS know.
#import <UIKit/UIKit.h>

@interface PSCAccessibility : NSObject <RCTBridgeModule>
@end

@implementation PSCAccessibility

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(isOnOffSwitchLabelsEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@(UIAccessibilityIsOnOffSwitchLabelsEnabled()));
  });
}

@end
