#!/usr/bin/env python3
"""EcoMeet Control Helper. Run this on the computer being helped.
Install once:  pip install pyautogui websockets
Run:           python ecomeet_control_helper.py
Safety: listens on this computer only, needs the pairing code, and only acts
after you allow control in EcoMeet. Stop any time: press Stop in EcoMeet,
close this window, or throw the mouse into a screen corner."""
import asyncio, json, secrets, sys
try:
    import pyautogui, websockets
except ImportError:
    sys.exit("Please run:  pip install pyautogui websockets")

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0
TOKEN = str(secrets.randbelow(900000) + 100000)
W, H = pyautogui.size()
BTN = {0: "left", 1: "middle", 2: "right"}
KEYS = {"Enter": "enter", "Backspace": "backspace", "Tab": "tab", "Escape": "esc",
        "Delete": "delete", "ArrowLeft": "left", "ArrowRight": "right", "ArrowUp": "up",
        "ArrowDown": "down", "Home": "home", "End": "end", "PageUp": "pageup",
        "PageDown": "pagedown", "Shift": "shift", "Control": "ctrl", "Alt": "alt",
        "Meta": "win", " ": "space", "CapsLock": "capslock"}

def pos(m):
    return (int(min(1, max(0, m.get("x", 0))) * (W - 1)),
            int(min(1, max(0, m.get("y", 0))) * (H - 1)))

def key(k):
    k = KEYS.get(k, k)
    return k.lower() if len(k) == 1 else (k if k in pyautogui.KEYBOARD_KEYS else None)

def act(m):
    a, b = m.get("a"), BTN.get(m.get("b", 0), "left")
    if a == "move":
        pyautogui.moveTo(*pos(m))
    elif a == "down":
        pyautogui.moveTo(*pos(m)); pyautogui.mouseDown(button=b)
    elif a == "up":
        pyautogui.moveTo(*pos(m)); pyautogui.mouseUp(button=b)
    elif a == "scroll":
        pyautogui.scroll(-int(m.get("dy", 0)) * 40)
    elif a in ("key", "keyup"):
        k = key(str(m.get("key", "")))
        if k:
            (pyautogui.keyDown if a == "key" else pyautogui.keyUp)(k)
    elif a == "release":
        for x in BTN.values():
            pyautogui.mouseUp(button=x)

async def handle(ws):
    ok = False
    async for raw in ws:
        try:
            m = json.loads(raw)
        except ValueError:
            continue
        if not ok:
            if m.get("a") == "hello" and secrets.compare_digest(str(m.get("tok")), TOKEN):
                ok = True
                await ws.send("ok")
                print("EcoMeet connected. Control starts only when you allow it in EcoMeet.")
                continue
            await ws.send("no")
            await ws.close()
            return
        try:
            act(m)
        except pyautogui.FailSafeException:
            print("Corner failsafe used. Disconnecting.")
            await ws.close()
            return
        except Exception as e:
            print("Skipped:", e)

async def main():
    async with websockets.serve(handle, "127.0.0.1", 47831):
        print("EcoMeet Control Helper is running.")
        print("Pairing code:", TOKEN)
        print("Type this code in EcoMeet when asked. Close this window to stop.")
        await asyncio.Future()

asyncio.run(main())
