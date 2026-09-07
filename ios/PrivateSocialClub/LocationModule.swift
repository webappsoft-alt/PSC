import Foundation
import CoreLocation
import React
import UIKit

@objc(LocationModule)
class LocationModule: NSObject, RCTBridgeModule {
    
    static func moduleName() -> String! {
        return "LocationModule"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc var bridge: RCTBridge!
    
    private static var locationService: LocationService?
    private static var isServiceRunning = false
    
    @objc
    func startLocationService(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if LocationModule.locationService == nil {
                LocationModule.locationService = LocationService()
                LocationModule.locationService?.setBridge(self.bridge)
            }
            
            LocationModule.locationService?.startLocationService { [weak self] success, error in
                if success {
                    LocationModule.isServiceRunning = true
                    resolve(nil)
                } else {
                    reject("LOCATION_SERVICE_ERROR", error?.localizedDescription ?? "Failed to start location service", error)
                }
            }
        }
    }
    
    @objc
    func stopLocationService(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            LocationModule.locationService?.stopLocationService()
            LocationModule.isServiceRunning = false
            resolve(nil)
        }
    }
    
    @objc
    func isServiceRunning(_ callback: RCTResponseSenderBlock) {
        callback([LocationModule.isServiceRunning])
    }
}