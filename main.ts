let LED_status: number = 0
let serial_str: string = ""
let GET_success: boolean = false
let client_ID = ""
let GET_command = ""
basic.showLeds(`
    # . . . #
    # . . . #
    . . . . .
    . . . . .
    . . . . .
    `)
let strip = neopixel.create(DigitalPin.P1, 60, NeoPixelMode.RGB)
basic.pause(100)
strip.showColor(neopixel.colors(NeoPixelColors.Red))
strip.show()
pins.digitalWritePin(DigitalPin.P6, 0)
// basic.pause(2000)
pins.digitalWritePin(DigitalPin.P7, 0)
// basic.pause(2000)
pins.digitalWritePin(DigitalPin.P9, 0)
// basic.pause(2000)
basic.showLeds(`
    # . . . #
    . # # # .
    . . . . .
    . . . . .
    . . . . .
    `)
basic.showIcon(IconNames.No)
let WIFI_MODE = 1
const Tx_pin: SerialPin = SerialPin.P8
const Rx_pin: SerialPin = SerialPin.P12
const LED_pin: DigitalPin = DigitalPin.P6
let SSID_1 = "your_SSID"
let PASSWORD_1 = "password"
let SSID_2 = "ESP8266"
let PASSWORD_2 = "microbit"
pins.digitalWritePin(LED_pin, 0)
serial.redirect(Tx_pin, Rx_pin, 115200)
// 設定ESP-01
sendAT("AT+RESTORE", 1000)
sendAT("AT+RST", 1000)
sendAT("AT+CWMODE=" + WIFI_MODE)
if (WIFI_MODE == 1) {
    sendAT("AT+CWJAP=\"" + SSID_1 + "\",\"" + PASSWORD_1 + "\"")
let result: boolean = wait_for_response("OK")
if (!(result)) {
        control.reset()
    }
} else if (WIFI_MODE == 2) {
    // 開放1個連線頻道, 驗證模式=4 (WPA_WPA2_PSK)
    sendAT("AT+CWSAP=\"" + SSID_2 + "\",\"" + PASSWORD_2 + "\",1,4", 1000)
}
// 設定伺服器
sendAT("AT+CIPMUX=1")
sendAT("AT+CIPSERVER=1,80")
// 顯示IP (在AP模式預設為192.168.4.1)
sendAT("AT+CIFSR")
strip.showColor(neopixel.colors(NeoPixelColors.Black))
// 顯示打勾圖案, 伺服器完成開啟
basic.showIcon(IconNames.Yes)
// 處理HTTP請求
while (true) {
    // 儲存最長200字的序列資料, 以免loss掉
    serial_str = "" + serial_str + serial.readString()
    if (serial_str.length > 200) {
        serial_str = serial_str.substr(serial_str.length - 200, 0)
    }
    if (serial_str.includes("+IPD") && serial_str.includes("HTTP")) {
        // 有連線請求
        client_ID = serial_str.substr(serial_str.indexOf("IPD") + 4, 1)
        let GET_pos: number = serial_str.indexOf("GET")
let HTTP_pos: number = serial_str.indexOf("HTTP")
GET_command = serial_str.substr(GET_pos + 5, HTTP_pos - 1 - (GET_pos + 5))
        // 判斷GET指令
        switch (GET_command) {
            case "": // request 192.168.x.x/
                GET_success = true
                break
            case "LED": // request 192.168.x.x/LED
                GET_success = true
                LED_status = 1 - LED_status
                pins.digitalWritePin(LED_pin, LED_status)

                if (LED_status == 1) {
                    strip.showColor(neopixel.colors(NeoPixelColors.White))
                } else {
                    strip.showColor(neopixel.colors(NeoPixelColors.Black))
                }
                strip.show()

                break
            case "LEDON": // request 192.168.x.x/LED
                GET_success = true
                LED_status = 1
                pins.digitalWritePin(LED_pin, LED_status)

                if (LED_status == 1) {
                    strip.showColor(neopixel.colors(NeoPixelColors.White))
                } else {
                    strip.showColor(neopixel.colors(NeoPixelColors.Black))
                }
                strip.show()

                break
            case "LEDOFF": // request 192.168.x.x/LED
                GET_success = true
                LED_status = 0
                pins.digitalWritePin(LED_pin, LED_status)

                if (LED_status == 1) {
                    strip.showColor(neopixel.colors(NeoPixelColors.White))
                } else {
                    strip.showColor(neopixel.colors(NeoPixelColors.Black))
                }
                strip.show()

                break
        }
// 產生HTML並傳給使用者
        let HTML_str: string = getHTML(GET_success)
sendAT("AT+CIPSEND=" + client_ID + "," + (HTML_str.length + 2))
sendAT(HTML_str, 1000)
// 關閉連線
        sendAT("AT+CIPCLOSE=" + client_ID)
serial_str = ""
    }
}
// 寫入AT指令並加上CR+LF
function sendAT(command: string, waitTime: number = 100) {
    serial.writeString(command + "\u000D\u000A")
    basic.pause(waitTime)
}
// 產生客戶端HTML
function getHTML(normal: boolean): string {
    let LED_statusString: string = ""
    let LED_buttonString: string = ""
    let web_title: string = "TECH in the Box Wifi on micro:bit"
    let html: string = ""
    html += "HTTP/1.1 200 OK\r\n"
    html += "Content-Type: text/html\r\n"
    html += "Connection: close\r\n\r\n"
    html += "<!DOCTYPE html>"
    html += "<html>"
    html += "<head>"
    html += "<link rel=\"icon\" href=\"data:,\">"
    html += "<title>" + web_title + "</title>"
    html += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" // mobile view
    html += "</head>"
    html += "<body>"
    html += "<div style=\"text-align:center\">"
    html += "<h1>" + web_title + "</h1>"
    html += "<br>"
    let NOT_LED_statusString = ""
    if (normal) {
        if (LED_status) {
            LED_statusString = "ON"
            LED_buttonString = "TURN IT OFF"
            NOT_LED_statusString = "OFF"
        } else {
            LED_statusString = "OFF"
            LED_buttonString = "TURN IT ON"
            NOT_LED_statusString = "ON"
        }
        html += "<h3>LED STATUS: " + LED_statusString + "</h3>"
        html += "<br>"
        html += "<input type=\"button\" onClick=\"window.location.href=\'LED" + NOT_LED_statusString + "\'\" value=\"" + LED_buttonString + "\">"
        html += "<br>"
    } else {
        html += "<h3>ERROR: REQUEST NOT FOUND</h3>"
    }
    html += "<br>"
    html += "<input type=\"button\" onClick=\"window.location.href=\'/'\" value=\"Home\">"
    html += "</div>"
    html += "</body>"
    html += "</html>"
    return html
}
// 等待wifi連線用
function wait_for_response(str: string): boolean {
    let result2: boolean = false
    let time: number = input.runningTime()
    while (true) {
        serial_str += serial.readString()
        if (serial_str.length > 200) {
            serial_str = serial_str.substr(serial_str.length - 200)
        }
        if (serial_str.includes(str)) {
            result2 = true
            break
        }
        if (input.runningTime() - time > 300000) break
    }
    return result2
}
