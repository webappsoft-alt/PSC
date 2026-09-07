import Foundation
import CoreLocation
import React
import UIKit

class LocationService: NSObject, CLLocationManagerDelegate {
    
    private var locationManager: CLLocationManager?
    private var bridge: RCTBridge?
    private var isServiceRunning = false
    private var backgroundTaskIdentifier: UIBackgroundTaskIdentifier = .invalid
    private var timer: Timer?
    private var permissionCompletion: ((Bool, Error?) -> Void)?
    
    private let locationUpdateInterval: TimeInterval = 5.0 // 5 seconds
    
    override init() {
        super.init()
        setupLocationManager()
        setupBackgroundTaskHandling()
    }
    
    func setBridge(_ bridge: RCTBridge) {
        self.bridge = bridge
    }
    
    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager?.delegate = self
        locationManager?.desiredAccuracy = kCLLocationAccuracyBest
        
        if #available(iOS 9.0, *) {
            locationManager?.pausesLocationUpdatesAutomatically = false
        }
    }
    
    private func setupBackgroundTaskHandling() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }
    
    @objc private func applicationDidEnterBackground() {
        startBackgroundTask()
    }
    
    @objc private func applicationWillEnterForeground() {
        endBackgroundTask()
    }
    
    private func startBackgroundTask() {
        backgroundTaskIdentifier = UIApplication.shared.beginBackgroundTask(withName: "LocationTracking") {
            self.endBackgroundTask()
        }
    }
    
    private func endBackgroundTask() {
        if backgroundTaskIdentifier != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskIdentifier)
            backgroundTaskIdentifier = .invalid
        }
    }
    
    func startLocationService(completion: @escaping (Bool, Error?) -> Void) {
        guard !isServiceRunning else {
            completion(true, nil)
            return
        }
        
        let authorizationStatus = locationManager?.authorizationStatus ?? .notDetermined
        
        switch authorizationStatus {
        case .notDetermined:
            permissionCompletion = completion
            locationManager?.requestAlwaysAuthorization()
            
        case .denied, .restricted:
            completion(false, NSError(domain: "LocationService", code: 2, userInfo: [NSLocalizedDescriptionKey: "Location permission denied"]))
            
        case .authorizedWhenInUse:
            permissionCompletion = completion
            locationManager?.requestAlwaysAuthorization()
            
        case .authorizedAlways:
            startLocationUpdates()
            completion(true, nil)
            
        @unknown default:
            completion(false, NSError(domain: "LocationService", code: 4, userInfo: [NSLocalizedDescriptionKey: "Unknown authorization status"]))
        }
    }
    
    private func startLocationUpdates() {
        guard let locationManager = locationManager else { return }
        
        isServiceRunning = true
        
        if #available(iOS 9.0, *) {
            locationManager.allowsBackgroundLocationUpdates = true
        }
        
        // Only use significant location changes for background
        locationManager.startMonitoringSignificantLocationChanges()
        
        // Start timer for periodic updates every 5 seconds
        timer = Timer.scheduledTimer(withTimeInterval: locationUpdateInterval, repeats: true) { [weak self] _ in
            self?.requestLocationUpdate()
        }
        
        // Get initial location immediately
        requestLocationUpdate()
        
        print("LocationService: Started location updates with 5-second interval")
    }
    
    private func requestLocationUpdate() {
        locationManager?.requestLocation()
    }
    
    func stopLocationService() {
        guard isServiceRunning else { return }
        
        isServiceRunning = false
        
        locationManager?.stopMonitoringSignificantLocationChanges()
        
        if #available(iOS 9.0, *) {
            locationManager?.allowsBackgroundLocationUpdates = false
        }
        
        timer?.invalidate()
        timer = nil
        
        endBackgroundTask()
        
        print("LocationService: Stopped location updates")
    }
    
    private func sendLocationToJS(_ location: CLLocation) {
        guard let bridge = bridge else {
            print("LocationService: Bridge not available")
            return
        }
        
        let locationData: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "speed": location.speed >= 0 ? location.speed : 0,
            "heading": location.course >= 0 ? location.course : 0,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000,
            "provider": "ios"
        ]
        
        DispatchQueue.main.async {
            bridge.eventDispatcher()?.sendAppEvent(withName: "locationUpdate", body: locationData)
        }
        
        print("LocationService: Location sent to JS - Lat: \(location.coordinate.latitude), Lon: \(location.coordinate.longitude)")
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        sendLocationToJS(location)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("LocationService: Location update failed with error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        print("LocationService: Authorization status changed to: \(status.rawValue)")
        
        switch status {
        case .authorizedAlways:
            if !isServiceRunning {
                startLocationUpdates()
            }
            if let completion = permissionCompletion {
                completion(true, nil)
                permissionCompletion = nil
            }
            
        case .denied, .restricted:
            stopLocationService()
            if let completion = permissionCompletion {
                completion(false, NSError(domain: "LocationService", code: 2, userInfo: [NSLocalizedDescriptionKey: "Location permission denied"]))
                permissionCompletion = nil
            }
            
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
            
        default:
            break
        }
    }
    
    deinit {
        stopLocationService()
        NotificationCenter.default.removeObserver(self)
    }
}