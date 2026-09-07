import Foundation
import CoreLocation
import React

@objc(GetCurrentLocation)
class GetCurrentLocation: NSObject, RCTBridgeModule, CLLocationManagerDelegate {
    
    static func moduleName() -> String! {
        return "GetCurrentLocation"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc var bridge: RCTBridge!
    
    private var locationManager: CLLocationManager?
    private var isLocationRequestInProgress = false
    private var currentPromise: RCTPromiseResolveBlock?
    private var currentReject: RCTPromiseRejectBlock?
    private var timeoutTimer: Timer?
    
    private let timeoutDuration: TimeInterval = 15.0 // 15 seconds
    private let lastKnownLocationMaxAge: TimeInterval = 5 * 60 // 5 minutes
    
    override init() {
        super.init()
        setupLocationManager()
    }
    
    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager?.delegate = self
        locationManager?.desiredAccuracy = kCLLocationAccuracyBest
        locationManager?.distanceFilter = 0 // Get immediate updates
    }
    
    @objc
    func getCurrentLocation(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Prevent multiple simultaneous requests
        if isLocationRequestInProgress {
            reject("LOCATION_REQUEST_IN_PROGRESS", "A location request is already in progress", nil)
            return
        }
        
        // Check location authorization
        let authorizationStatus = locationManager?.authorizationStatus ?? .notDetermined
        
        switch authorizationStatus {
        case .notDetermined:
            // Request permission first
            currentPromise = resolve
            currentReject = reject
            locationManager?.requestWhenInUseAuthorization()
            return
            
        case .denied, .restricted:
            reject("PERMISSION_DENIED", "Location permission not granted", nil)
            return
            
        case .authorizedWhenInUse, .authorizedAlways:
            break
            
        @unknown default:
            reject("PERMISSION_DENIED", "Unknown location permission status", nil)
            return
        }
        
        // Check if location services are enabled
        if !CLLocationManager.locationServicesEnabled() {
            reject("LOCATION_DISABLED", "Location services are disabled", nil)
            return
        }
        
        currentPromise = resolve
        currentReject = reject
        startLocationRequest()
    }
    
    private func startLocationRequest() {
        isLocationRequestInProgress = true
        
        // Set timeout
        timeoutTimer = Timer.scheduledTimer(withTimeInterval: timeoutDuration, repeats: false) { [weak self] _ in
            self?.handleTimeout()
        }
        
        // First try to get last known location if it's recent enough
        if let lastLocation = locationManager?.location {
            let locationAge = Date().timeIntervalSince(lastLocation.timestamp)
            if locationAge <= lastKnownLocationMaxAge {
                print("GetCurrentLocation: Using last known location (age: \(locationAge)s)")
                handleLocationResult(lastLocation)
                return
            }
        }
        
        // Request new location
        locationManager?.requestLocation()
    }
    
    private func handleLocationResult(_ location: CLLocation) {
        guard isLocationRequestInProgress, let resolve = currentPromise else {
            return
        }
        
        print("GetCurrentLocation: Location result - lat: \(location.coordinate.latitude), lon: \(location.coordinate.longitude), accuracy: \(location.horizontalAccuracy)")
        
        let locationData: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "speed": location.speed >= 0 ? location.speed : 0,
            "heading": location.course >= 0 ? location.course : 0,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000, // Convert to milliseconds
            "provider": "ios"
        ]
        
        resolve(locationData)
        
        // Emit event for any listeners (optional - for future use)
        // Note: Event emission is not required for basic location functionality
        
        cleanup()
    }
    
    private func handleTimeout() {
        guard isLocationRequestInProgress, let reject = currentReject else {
            return
        }
        
        print("GetCurrentLocation: Location request timed out")
        
        // Try one more time with last known location if available
        if let lastLocation = locationManager?.location {
            print("GetCurrentLocation: Using stale last known location due to timeout")
            handleLocationResult(lastLocation)
            return
        }
        
        reject("TIMEOUT", "Location request timed out", nil)
        cleanup()
    }
    
    private func cleanup() {
        isLocationRequestInProgress = false
        currentPromise = nil
        currentReject = nil
        
        timeoutTimer?.invalidate()
        timeoutTimer = nil
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        handleLocationResult(location)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        guard isLocationRequestInProgress, let reject = currentReject else {
            return
        }
        
        print("GetCurrentLocation: Location error - \(error.localizedDescription)")
        
        let errorCode: String
        let errorMessage: String
        
        if let clError = error as? CLError {
            switch clError.code {
            case .denied:
                errorCode = "PERMISSION_DENIED"
                errorMessage = "Location permission was denied. Please enable location services for this app."
            case .locationUnknown:
                errorCode = "LOCATION_ERROR"
                errorMessage = "Location services are not available. Please enable location services."
            case .network:
                errorCode = "LOCATION_ERROR"
                errorMessage = "Network error occurred while getting location."
            default:
                errorCode = "LOCATION_ERROR"
                errorMessage = "Unable to get your location. Please try again."
            }
        } else {
            errorCode = "LOCATION_ERROR"
            errorMessage = error.localizedDescription
        }
        
        reject(errorCode, errorMessage, error)
        cleanup()
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        // Handle authorization changes
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            if isLocationRequestInProgress {
                startLocationRequest()
            }
        case .denied, .restricted:
            if let reject = currentReject {
                reject("PERMISSION_DENIED", "Location permission was denied", nil)
                cleanup()
            }
        case .notDetermined:
            // Still waiting for user decision
            break
        @unknown default:
            if let reject = currentReject {
                reject("PERMISSION_DENIED", "Unknown location permission status", nil)
                cleanup()
            }
        }
    }
    
    // MARK: - Additional Methods
    
    @objc
    func stopLocationService(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        print("GetCurrentLocation: Stopping location service")
        cleanup()
        resolve(nil)
    }
    
    @objc
    func isLocationPermissionGranted(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        let status = locationManager?.authorizationStatus ?? .notDetermined
        let isGranted = status == .authorizedWhenInUse || status == .authorizedAlways
        resolve(isGranted)
    }
    
    @objc
    func isLocationServicesEnabled(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        resolve(CLLocationManager.locationServicesEnabled())
    }
}