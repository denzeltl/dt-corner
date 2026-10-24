/// Seconds since the last keyboard or mouse input anywhere on the system.
/// Only the idle duration is read, never which keys or where the mouse is.
#[tauri::command]
fn get_system_idle_seconds() -> Result<u64, String> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::SystemInformation::GetTickCount;
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if unsafe { GetLastInputInfo(&mut info) } == 0 {
            return Err("GetLastInputInfo failed".into());
        }
        let now = unsafe { GetTickCount() };
        Ok(u64::from(now.wrapping_sub(info.dwTime)) / 1000)
    }
    #[cfg(not(windows))]
    {
        Err("System idle time is only available on Windows".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![get_system_idle_seconds])
        .run(tauri::generate_context!())
        .expect("error while running DT Corner");
}
