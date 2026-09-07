#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LocationModule, NSObject)

RCT_EXTERN_METHOD(startLocationService:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopLocationService:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isServiceRunning:(RCTResponseSenderBlock)callback)

@end