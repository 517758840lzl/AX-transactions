import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate, UIDocumentPickerDelegate {
  private var downloadResult: FlutterResult?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    let channel = FlutterMethodChannel(
      name: "ledger/downloads",
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    channel.setMethodCallHandler { [weak self] call, result in
      guard call.method == "save",
            let args = call.arguments as? [String: Any],
            let name = args["name"] as? String,
            let text = args["text"] as? String
      else {
        result(FlutterMethodNotImplemented)
        return
      }
      self?.exportFile(name: name, text: text, result: result)
    }
  }

  private func exportFile(name: String, text: String, result: @escaping FlutterResult) {
    let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
    do {
      try Data(text.utf8).write(to: url, options: .atomic)
    } catch {
      result(FlutterError(code: "save", message: error.localizedDescription, details: nil))
      return
    }
    DispatchQueue.main.async {
      guard let presenter = self.frontController() else {
        result(FlutterError(code: "save", message: "window", details: nil))
        return
      }
      self.downloadResult = result
      let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
      picker.delegate = self
      presenter.present(picker, animated: true)
    }
  }

  private func frontController() -> UIViewController? {
    if let controller = window?.rootViewController {
      return controller
    }
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let key = scenes.flatMap(\.windows).first { $0.isKeyWindow }
    return key?.rootViewController ?? scenes.flatMap(\.windows).first?.rootViewController
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    downloadResult?(nil)
    downloadResult = nil
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    downloadResult?(FlutterError(code: "cancel", message: "cancel", details: nil))
    downloadResult = nil
  }
}
