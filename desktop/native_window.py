"""Janela de controle com a API nativa do Windows, sem runtime gráfico extra."""
import ctypes
from ctypes import wintypes
import os
import webbrowser

LRESULT = ctypes.c_ssize_t
CALLBACK = ctypes.WINFUNCTYPE(LRESULT, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)


class WNDCLASS(ctypes.Structure):
    _fields_ = [("style", wintypes.UINT), ("lpfnWndProc", CALLBACK),
        ("cbClsExtra", ctypes.c_int), ("cbWndExtra", ctypes.c_int),
        ("hInstance", wintypes.HINSTANCE), ("hIcon", wintypes.HICON),
        ("hCursor", wintypes.HANDLE), ("hbrBackground", wintypes.HBRUSH),
        ("lpszMenuName", wintypes.LPCWSTR), ("lpszClassName", wintypes.LPCWSTR)]


def rgb(r, g, b):
    return r | (g << 8) | (b << 16)


class NativeWindow:
    def __init__(self, server, url, folder, icon, show=True):
        self.server, self.url, self.folder = server, url, folder
        self.user = ctypes.WinDLL("user32", use_last_error=True)
        self.gdi = ctypes.WinDLL("gdi32", use_last_error=True)
        self.kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        self.kernel.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
        self.kernel.GetModuleHandleW.restype = wintypes.HMODULE
        self.user.DefWindowProcW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        self.user.DefWindowProcW.restype = LRESULT
        self.user.RegisterClassW.argtypes = [ctypes.POINTER(WNDCLASS)]
        self.user.RegisterClassW.restype = wintypes.WORD
        self.user.CreateWindowExW.argtypes = [wintypes.DWORD,wintypes.LPCWSTR,wintypes.LPCWSTR,wintypes.DWORD,
            ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_int,wintypes.HWND,wintypes.HMENU,wintypes.HINSTANCE,ctypes.c_void_p]
        self.user.CreateWindowExW.restype = wintypes.HWND
        self.user.DestroyWindow.argtypes = [wintypes.HWND]
        self.user.ShowWindow.argtypes = [wintypes.HWND,ctypes.c_int]
        self.user.LoadImageW.argtypes = [wintypes.HINSTANCE,wintypes.LPCWSTR,wintypes.UINT,ctypes.c_int,ctypes.c_int,wintypes.UINT]
        self.user.LoadImageW.restype = wintypes.HANDLE
        self.user.SendMessageW.argtypes = [wintypes.HWND,wintypes.UINT,wintypes.WPARAM,wintypes.LPARAM]
        self.user.SendMessageW.restype = LRESULT
        self.user.GetMessageW.argtypes = [ctypes.POINTER(wintypes.MSG),wintypes.HWND,wintypes.UINT,wintypes.UINT]
        self.user.TranslateMessage.argtypes = [ctypes.POINTER(wintypes.MSG)]
        self.user.DispatchMessageW.argtypes = [ctypes.POINTER(wintypes.MSG)]
        self.user.DispatchMessageW.restype = LRESULT
        self.gdi.CreateSolidBrush.argtypes = [wintypes.DWORD]
        self.gdi.CreateSolidBrush.restype = wintypes.HBRUSH
        self.gdi.GetStockObject.argtypes = [ctypes.c_int]
        self.gdi.GetStockObject.restype = wintypes.HANDLE
        self.gdi.SetTextColor.argtypes = [wintypes.HDC,wintypes.DWORD]
        self.gdi.SetBkColor.argtypes = [wintypes.HDC,wintypes.DWORD]
        self.brush = self.gdi.CreateSolidBrush(rgb(6,24,41))
        self.callback = CALLBACK(self.handle_message)
        self.instance = self.kernel.GetModuleHandleW(None)
        self.icon = self.user.LoadImageW(None,str(icon),1,32,32,0x10) if icon.exists() else None
        self.class_name = "NexoLogDesktopWindow"
        window_class = WNDCLASS(0,self.callback,0,0,self.instance,self.icon,None,self.brush,None,self.class_name)
        if not self.user.RegisterClassW(ctypes.byref(window_class)):
            raise ctypes.WinError(ctypes.get_last_error())
        left = max(0,(self.user.GetSystemMetrics(0)-500)//2)
        top = max(0,(self.user.GetSystemMetrics(1)-330)//2)
        self.handle = self.user.CreateWindowExW(0,self.class_name,"NexoLog",0x00CA0000,
            left,top,500,330,None,None,self.instance,None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        self.add_control("STATIC","NexoLog  |  Sua operação conectada",24,22,448,26)
        self.add_control("STATIC","Sistema em execução • Demonstração local",24,58,448,26)
        self.add_control("STATIC","Use o navegador para acessar o sistema.\nMantenha esta janela aberta durante a utilização.",24,91,448,46)
        self.add_control("BUTTON","Abrir NexoLog",24,150,448,38,1)
        self.add_control("BUTTON","Abrir pasta de dados",24,198,215,32,2)
        self.add_control("BUTTON","Encerrar programa",257,198,215,32,3)
        self.add_control("STATIC","Login: escolha “Usar acesso demo”.",24,246,448,26)
        if show:
            self.user.ShowWindow(self.handle,1)

    def add_control(self, kind, text, x, y, width, height, identifier=0):
        handle = self.user.CreateWindowExW(0,kind,text,0x50000000,x,y,width,height,
            self.handle,identifier,self.instance,None)
        if not handle:
            raise ctypes.WinError(ctypes.get_last_error())
        self.user.SendMessageW(handle,0x30,self.gdi.GetStockObject(17),1)

    def handle_message(self, hwnd, message, wparam, lparam):
        if message == 0x0111:
            action = wparam & 0xffff
            if action == 1:
                webbrowser.open(self.url)
            elif action == 2:
                os.startfile(str(self.folder))
            elif action == 3:
                self.destroy()
            return 0
        if message == 0x0010:
            self.destroy()
            return 0
        if message == 0x0002:
            self.server.should_exit = True
            self.user.PostQuitMessage(0)
            return 0
        if message == 0x0138:
            self.gdi.SetTextColor(wparam,rgb(191,212,233))
            self.gdi.SetBkColor(wparam,rgb(6,24,41))
            return self.brush
        return self.user.DefWindowProcW(hwnd,message,wparam,lparam)

    def destroy(self):
        self.user.DestroyWindow(self.handle)

    def run(self):
        message = wintypes.MSG()
        while True:
            status = self.user.GetMessageW(ctypes.byref(message),None,0,0)
            if status == 0:
                break
            if status == -1:
                raise ctypes.WinError(ctypes.get_last_error())
            self.user.TranslateMessage(ctypes.byref(message))
            self.user.DispatchMessageW(ctypes.byref(message))
