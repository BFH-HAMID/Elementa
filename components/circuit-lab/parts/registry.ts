/**
 * Data-driven part registry for the Circuit Lab.
 *
 * Every entry is plain data: pin map (world units, 10 = 2.54 mm), property
 * schema, default values, electrical model and info-card text. Renderers are
 * selected by `family`, the solver by `model`. To add a part, append an entry
 * here (see CIRCUIT_LAB_GUIDE.md → "Adding a component").
 *
 * Pin coordinates are relative to the part's top-left corner in its unrotated
 * orientation and are multiples of 10 so they land on breadboard holes.
 */

import { breadboardPins, breadboardSize, gridPins } from './holes';
import type { PartCategory, PartDef, PinDef, PinKind, PropDef, PropValue } from '../types';

export const CATEGORY_ORDER: PartCategory[] = [
  'boards',
  'prototyping',
  'passives',
  'semiconductors',
  'ics',
  'sensors',
  'power',
  'tools'
];

// ── Helpers ────────────────────────────────────────────────────────────────

function P(id: string, label: string, x: number, y: number, kind: PinKind = 'io', io?: number, func?: string): PinDef {
  return { id, label, x, y, kind, io, func: func ?? label };
}

/**
 * Pins in a vertical column starting at (x, y0), 10-unit pitch. Ids come from
 * the label; repeated labels (several GND pins) get a positional suffix so
 * every pin id stays unique within the part.
 */
function colPins(names: [string, PinKind?, string?][], x: number, y0: number, step = 10): PinDef[] {
  const seen = new Map<string, number>();
  return names.map(([label, kind, func], i) => {
    const base = label.replace(/[^A-Za-z0-9]/g, '');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}_${i}`;
    return P(id, label, x, y0 + i * step, kind ?? 'io', undefined, func);
  });
}

/**
 * DIP package pins. `names[i]` is pin i+1. Pin 1 is top-left, numbering runs
 * down the left side and back up the right side (notch at top).
 */
function dipPins(names: string[], kinds: Record<string, PinKind> = {}): PinDef[] {
  const n = names.length;
  const half = n / 2;
  return names.map((name, i) => {
    const pinNo = i + 1;
    const left = i < half;
    const y = left ? 10 * (i + 1) : 10 * (n - i);
    const x = left ? 10 : 40;
    const kind: PinKind = kinds[name] ?? (name === 'GND' ? 'gnd' : name === 'VCC' || name === 'VDD' || name === 'V+' ? 'vcc' : 'io');
    return { id: String(pinNo), label: name, x, y, kind, func: `Pin ${pinNo} · ${name}` };
  });
}

function dipSize(n: number) {
  return { w: 50, h: 10 * (n / 2 + 1) };
}

/** Standard two-lead body: leads on the left and right edges. */
function twoLead(): { w: number; h: number } {
  return { w: 40, h: 20 };
}

function prop(key: string, label: string, extra: Partial<PropDef> = {}): PropDef {
  return { key, label, type: 'number', ...extra };
}

const RESISTOR_E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

export const RESISTOR_VALUES = RESISTOR_E12.flatMap((v) => [v, v * 10, v * 100, v * 1000, v * 10000]).sort((a, b) => a - b);

// ── Shared tool/board building blocks ──────────────────────────────────────

const ESP32_30_LEFT: [string, PinKind?, string?][] = [
  ['EN', 'nc', 'EN · Reset (active-high, pull-up)'],
  ['VP', 'ain', 'GPIO36 · ADC1_0 · VP'],
  ['VN', 'ain', 'GPIO39 · ADC1_3 · VN'],
  ['D34', 'ain', 'GPIO34 · ADC1_6 (input only)'],
  ['D35', 'ain', 'GPIO35 · ADC1_7 (input only)'],
  ['D32', 'ain', 'GPIO32 · ADC1_4 · touch 9'],
  ['D33', 'ain', 'GPIO33 · ADC1_5 · touch 8'],
  ['D25', 'io', 'GPIO25 · DAC1'],
  ['D26', 'io', 'GPIO26 · DAC2'],
  ['D27', 'io', 'GPIO27 · touch 7'],
  ['D14', 'io', 'GPIO14 · HSPI SCK'],
  ['D12', 'io', 'GPIO12 · HSPI MISO (boot strap)'],
  ['GND', 'gnd', 'GND'],
  ['D13', 'io', 'GPIO13 · HSPI MOSI'],
  ['VIN', 'vin', 'VIN · 5 V input / output'],
];

const ESP32_30_RIGHT: [string, PinKind?, string?][] = [
  ['D23', 'io', 'GPIO23 · VSPI MOSI'],
  ['D22', 'io', 'GPIO22 · I²C SCL (default)'],
  ['TX0', 'io', 'GPIO1 · UART0 TXD'],
  ['RX0', 'io', 'GPIO3 · UART0 RXD'],
  ['D21', 'io', 'GPIO21 · I²C SDA (default)'],
  ['GND', 'gnd', 'GND'],
  ['D19', 'io', 'GPIO19 · VSPI MISO'],
  ['D18', 'io', 'GPIO18 · VSPI SCK'],
  ['D5', 'io', 'GPIO5 · VSPI SS'],
  ['TX2', 'io', 'GPIO17 · UART2 TXD'],
  ['RX2', 'io', 'GPIO16 · UART2 RXD'],
  ['D4', 'io', 'GPIO4 · touch 0'],
  ['D2', 'io', 'GPIO2 · onboard LED'],
  ['D15', 'io', 'GPIO15 · boot strap'],
  ['3V3', 'vcc', '3.3 V regulated output'],
];

// 38-pin carrier: same GPIO map, plus flash pins, extra grounds and BOOT on GPIO0.
const ESP32_38_LEFT: [string, PinKind?, string?][] = [
  ['EN', 'nc', 'EN · Reset (active-high)'],
  ['VP', 'ain', 'GPIO36 · ADC1_0 · VP'],
  ['VN', 'ain', 'GPIO39 · ADC1_3 · VN'],
  ['D34', 'ain', 'GPIO34 · ADC1_6 (input only)'],
  ['D35', 'ain', 'GPIO35 · ADC1_7 (input only)'],
  ['D32', 'ain', 'GPIO32 · ADC1_4'],
  ['D33', 'ain', 'GPIO33 · ADC1_5'],
  ['D25', 'io', 'GPIO25 · DAC1'],
  ['D26', 'io', 'GPIO26 · DAC2'],
  ['D27', 'io', 'GPIO27'],
  ['D14', 'io', 'GPIO14 · HSPI SCK'],
  ['D12', 'io', 'GPIO12 · HSPI MISO'],
  ['GND', 'gnd', 'GND'],
  ['D13', 'io', 'GPIO13 · HSPI MOSI'],
  ['SD2', 'nc', 'GPIO9 · flash (reserved)'],
  ['SD3', 'nc', 'GPIO10 · flash (reserved)'],
  ['CMD', 'nc', 'GPIO11 · flash (reserved)'],
  ['VIN', 'vin', 'VIN · 5 V'],
  ['GND', 'gnd', 'GND'],
];

const ESP32_38_RIGHT: [string, PinKind?, string?][] = [
  ['D23', 'io', 'GPIO23 · VSPI MOSI'],
  ['D22', 'io', 'GPIO22 · I²C SCL (default)'],
  ['TX0', 'io', 'GPIO1 · UART0 TXD'],
  ['RX0', 'io', 'GPIO3 · UART0 RXD'],
  ['D21', 'io', 'GPIO21 · I²C SDA (default)'],
  ['GND', 'gnd', 'GND'],
  ['D19', 'io', 'GPIO19 · VSPI MISO'],
  ['D18', 'io', 'GPIO18 · VSPI SCK'],
  ['D5', 'io', 'GPIO5 · VSPI SS'],
  ['TX2', 'io', 'GPIO17 · UART2 TXD'],
  ['RX2', 'io', 'GPIO16 · UART2 RXD'],
  ['D4', 'io', 'GPIO4 · touch 0'],
  ['D2', 'io', 'GPIO2 · onboard LED'],
  ['D15', 'io', 'GPIO15 · boot strap'],
  ['D0', 'io', 'GPIO0 · BOOT strap'],
  ['3V3', 'vcc', '3.3 V output'],
  ['GND', 'gnd', 'GND'],
  ['NC', 'nc', 'Not connected'],
  ['NC', 'nc', 'Not connected'],
];

/**
 * Make every pin id unique within a part. Repeated labels (several GND pins on
 * different headers) keep the first id and get a positional suffix afterwards.
 */
function uniquePins(pins: PinDef[]): PinDef[] {
  const seen = new Set<string>();
  return pins.map((pin, i) => {
    let id = pin.id;
    if (seen.has(id)) id = `${pin.id}_${i}`;
    seen.add(id);
    return id === pin.id ? pin : { ...pin, id };
  });
}

// ── Part library ───────────────────────────────────────────────────────────

const boards: PartDef[] = [
  {
    id: 'esp32-devkit-30',
    category: 'boards',
    family: 'board',
    name: 'ESP32 DevKit V1 (30-pin)',
    partNumber: 'ESP32-WROOM-32',
    w: 100,
    h: 190,
    pins: [...colPins(ESP32_30_LEFT, 0, 20), ...colPins(ESP32_30_RIGHT, 90, 20)],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'Dual-core 240 MHz Xtensa LX6 MCU with Wi-Fi and Bluetooth. Pins run on 3.3 V logic; they are NOT 5 V tolerant. Default I²C pins are GPIO21 (SDA) and GPIO22 (SCL).',
    ratings: ['Logic 3.3 V — do not feed 5 V into GPIO', 'VIN 4.8–5.5 V via USB or VIN pin', 'Max 12 mA per GPIO (recommended)', 'Operating −40…85 °C'],
    art: { usb: true, buttons: [{ id: 'EN', label: 'EN' }, { id: 'BOOT', label: 'BOOT', pin: 'D0' }], onboardLeds: [{ id: 'led', label: 'LED', pin: 'D2', color: 'blue' }], antenna: true, bodyColor: '#1f5f3a' }
  },
  {
    id: 'esp32-devkit-38',
    category: 'boards',
    family: 'board',
    name: 'ESP32 DevKit V1 (38-pin)',
    partNumber: 'ESP32-WROOM-32D',
    w: 100,
    h: 230,
    pins: [...colPins(ESP32_38_LEFT, 0, 20), ...colPins(ESP32_38_RIGHT, 90, 20)],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'ESP32 WROOM module on a 38-pin DevKit carrier with two extra ground pins and flash pins. Same GPIO map as the 30-pin board. Use GPIO21/22 for I²C.',
    ratings: ['Logic 3.3 V — not 5 V tolerant', 'VIN 4.8–5.5 V', 'Flash pins SD2/SD3/CMD are reserved'],
    art: { usb: true, buttons: [{ id: 'EN', label: 'EN' }, { id: 'BOOT', label: 'BOOT', pin: 'D0' }], onboardLeds: [{ id: 'led', label: 'LED', pin: 'D2', color: 'blue' }], antenna: true, bodyColor: '#1f5f3a' }
  },
  {
    id: 'arduino-uno',
    category: 'boards',
    family: 'board',
    name: 'Arduino Uno R3',
    partNumber: 'ATmega328P-PU',
    w: 300,
    h: 200,
    pins: [
      P('AREF', 'AREF', 130, 10, 'io', undefined, 'AREF · analog reference'),
      P('GND_T', 'GND', 140, 10, 'gnd', undefined, 'GND'),
      P('D13', 'D13', 150, 10, 'pwm', 13, 'D13 · SCK · onboard LED'),
      P('D12', 'D12', 160, 10, 'io', 12, 'D12 · MISO'),
      P('D11', 'D11', 170, 10, 'pwm', 11, 'D11 · MOSI · PWM'),
      P('D10', 'D10', 180, 10, 'pwm', 10, 'D10 · SS · PWM'),
      P('D9', 'D9', 190, 10, 'pwm', 9, 'D9 · PWM'),
      P('D8', 'D8', 200, 10, 'io', 8, 'D8'),
      P('D7', 'D7', 220, 10, 'io', 7, 'D7'),
      P('D6', 'D6', 230, 10, 'pwm', 6, 'D6 · PWM'),
      P('D5', 'D5', 240, 10, 'pwm', 5, 'D5 · PWM'),
      P('D4', 'D4', 250, 10, 'io', 4, 'D4'),
      P('D3', 'D3', 260, 10, 'pwm', 3, 'D3 · PWM · INT1'),
      P('D2', 'D2', 270, 10, 'io', 2, 'D2 · INT0'),
      P('D1', 'TX', 280, 10, 'io', 1, 'D1 · TXD'),
      P('D0', 'RX', 290, 10, 'io', 0, 'D0 · RXD'),
      P('NC', 'NC', 110, 190, 'nc', undefined, 'Not connected'),
      P('IOREF', 'IOREF', 120, 190, 'vcc', undefined, 'IOREF · logic reference'),
      P('RESET', 'RESET', 130, 190, 'nc', undefined, 'RESET · active low'),
      P('3V3', '3V3', 140, 190, 'vcc', undefined, '3.3 V output'),
      P('5V', '5V', 150, 190, 'vcc', undefined, '5 V output'),
      P('GND_B1', 'GND', 160, 190, 'gnd', undefined, 'GND'),
      P('GND_B2', 'GND', 170, 190, 'gnd', undefined, 'GND'),
      P('VIN', 'VIN', 180, 190, 'vin', undefined, 'VIN · 7–12 V input'),
      P('A0', 'A0', 210, 190, 'ain', 14, 'A0 · ADC0'),
      P('A1', 'A1', 220, 190, 'ain', 15, 'A1 · ADC1'),
      P('A2', 'A2', 230, 190, 'ain', 16, 'A2 · ADC2'),
      P('A3', 'A3', 240, 190, 'ain', 17, 'A3 · ADC3'),
      P('A4', 'A4', 250, 190, 'ain', 18, 'A4 · SDA (I²C)'),
      P('A5', 'A5', 260, 190, 'ain', 19, 'A5 · SCL (I²C)')
    ],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'ATmega328P at 16 MHz, 14 digital I/O (6 PWM), 6 analog inputs, USB-serial. Operates at 5 V logic. I²C: A4 (SDA) and A5 (SCL). SPI: D10–D13. UART: D0/D1.',
    ratings: ['Logic 5 V', 'VIN 7–12 V (recommended)', 'Max 40 mA per I/O pin', '3.3 V / 5 V outputs ≤ 50 mA total'],
    art: { usb: true, buttons: [{ id: 'RESET', label: 'RESET' }], onboardLeds: [{ id: 'L', label: 'L', pin: 'D13', color: 'orange' }], bodyColor: '#1d6f93' }
  },
  {
    id: 'arduino-nano',
    category: 'boards',
    family: 'board',
    name: 'Arduino Nano',
    partNumber: 'ATmega328P (CH340)',
    w: 200,
    h: 460,
    pins: [
      ...colPins([['D13', 'pwm', 'D13 · SCK · LED'], ['3V3', 'vcc', '3.3 V'], ['AREF', 'io', 'AREF'], ['A0', 'ain', 'A0 · ADC0'], ['A1', 'ain', 'A1 · ADC1'], ['A2', 'ain', 'A2'], ['A3', 'ain', 'A3'], ['A4', 'ain', 'A4 · SDA'], ['A5', 'ain', 'A5 · SCL'], ['A6', 'ain', 'A6 · ADC only'], ['A7', 'ain', 'A7 · ADC only'], ['5V', 'vcc', '5 V'], ['RST', 'nc', 'RESET'], ['GND', 'gnd', 'GND'], ['VIN', 'vin', 'VIN 7–12 V']], 0, 20),
      ...colPins([['D12', 'io', 'D12 · MISO'], ['D11', 'pwm', 'D11 · MOSI · PWM'], ['D10', 'pwm', 'D10 · SS · PWM'], ['D9', 'pwm', 'D9 · PWM'], ['D8', 'io', 'D8'], ['D7', 'io', 'D7'], ['D6', 'pwm', 'D6 · PWM'], ['D5', 'pwm', 'D5 · PWM'], ['D4', 'io', 'D4'], ['D3', 'pwm', 'D3 · PWM'], ['D2', 'io', 'D2'], ['GND', 'gnd', 'GND'], ['RST', 'nc', 'RESET'], ['D0', 'io', 'D0 · RX'], ['D1', 'io', 'D1 · TX']], 190, 20)
    ],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'Breadboard-friendly ATmega328P board with the same core as the Uno. Pins run along both long edges at 0.1" pitch, so it sits straight across a breadboard\'s centre channel.',
    ratings: ['Logic 5 V', 'VIN 7–12 V', 'Max 40 mA per I/O pin'],
    art: { usb: true, buttons: [{ id: 'RST', label: 'RST' }], onboardLeds: [{ id: 'L', label: 'L', pin: 'D13', color: 'orange' }], bodyColor: '#2a6f8f' }
  },
  {
    id: 'rpi-pico',
    category: 'boards',
    family: 'board',
    name: 'Raspberry Pi Pico',
    partNumber: 'RP2040',
    w: 210,
    h: 510,
    pins: [
      ...colPins(
        [['GP0', 'io', 'GP0 · UART0 TX'], ['GP1', 'io', 'GP1 · UART0 RX'], ['GND', 'gnd', 'GND'], ['GP2', 'io', 'GP2 · I²C1 SDA'], ['GP3', 'io', 'GP3 · I²C1 SCL'], ['GP4', 'io', 'GP4 · I²C0 SDA'], ['GP5', 'io', 'GP5 · I²C0 SCL'], ['GND', 'gnd', 'GND'], ['GP6', 'io', 'GP6'], ['GP7', 'io', 'GP7'], ['GP8', 'io', 'GP8'], ['GP9', 'io', 'GP9'], ['GND', 'gnd', 'GND'], ['GP10', 'io', 'GP10'], ['GP11', 'io', 'GP11'], ['GP12', 'io', 'GP12'], ['GP13', 'io', 'GP13'], ['GND', 'gnd', 'GND'], ['GP14', 'io', 'GP14'], ['GP15', 'io', 'GP15']],
        0,
        20
      ),
      ...colPins(
        [['VBUS', 'vin', 'VBUS · 5 V USB'], ['VSYS', 'vin', 'VSYS · 1.8–5.5 V'], ['GND', 'gnd', 'GND'], ['3V3_EN', 'nc', '3V3 enable'], ['3V3', 'vcc', '3.3 V output'], ['ADC_VREF', 'ain', 'ADC reference'], ['GP28', 'ain', 'GP28 · ADC2'], ['GND', 'gnd', 'GND'], ['GP27', 'ain', 'GP27 · ADC1'], ['GP26', 'ain', 'GP26 · ADC0'], ['RUN', 'nc', 'RUN · reset'], ['GP22', 'io', 'GP22'], ['GND', 'gnd', 'GND'], ['GP21', 'io', 'GP21'], ['GP20', 'io', 'GP20'], ['GP19', 'io', 'GP19 · SPI0 TX'], ['GP18', 'io', 'GP18 · SPI0 SCK'], ['GND', 'gnd', 'GND'], ['GP17', 'io', 'GP17 · SPI0 CSn'], ['GP16', 'io', 'GP16 · SPI0 RX']],
        190,
        20
      )
    ],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'RP2040 dual-core Cortex-M0+ at 133 MHz with 26 GPIO (3 ADC), 3.3 V logic. Programmed over USB (MicroPython/C). GP25 drives the onboard LED. Pins are NOT 5 V tolerant.',
    ratings: ['Logic 3.3 V — not 5 V tolerant', 'VBUS 4.75–5.25 V', 'Max 12 mA per GPIO recommended'],
    art: { usb: true, buttons: [{ id: 'RUN', label: 'RUN' }, { id: 'BOOTSEL', label: 'BOOTSEL' }], onboardLeds: [{ id: 'led', label: 'LED', pin: 'GP25', color: 'green' }], bodyColor: '#1c7a4d' }
  },
  {
    id: 'stm32-bluepill',
    category: 'boards',
    family: 'board',
    name: 'STM32 Blue Pill (F103C8)',
    partNumber: 'STM32F103C8T6',
    w: 130,
    h: 230,
    pins: [
      ...colPins([['G', 'gnd', 'GND'], ['3V3', 'vcc', '3.3 V'], ['RST', 'nc', 'NRST'], ['B12', 'io', 'PB12'], ['B13', 'io', 'PB13 · SPI2 SCK'], ['B14', 'io', 'PB14 · SPI2 MISO'], ['B15', 'io', 'PB15 · SPI2 MOSI'], ['A8', 'pwm', 'PA8 · TIM1_CH1'], ['A9', 'io', 'PA9 · USART1 TX'], ['A10', 'io', 'PA10 · USART1 RX'], ['A11', 'io', 'PA11 · USB D-'], ['A12', 'io', 'PA12 · USB D+'], ['A15', 'io', 'PA15'], ['B3', 'io', 'PB3'], ['B4', 'io', 'PB4'], ['B5', 'io', 'PB5'], ['B6', 'io', 'PB6 · I²C1 SCL'], ['B7', 'io', 'PB7 · I²C1 SDA'], ['B8', 'io', 'PB8'], ['B9', 'io', 'PB9'], ['5V', 'vin', '5 V']], 0, 20),
      ...colPins([['G', 'gnd', 'GND'], ['G2', 'gnd', 'GND'], ['3V3', 'vcc', '3.3 V'], ['B11', 'io', 'PB11'], ['B10', 'io', 'PB10 · USART3 TX'], ['B1', 'ain', 'PB1 · ADC1_9'], ['B0', 'ain', 'PB0 · ADC1_8'], ['A7', 'ain', 'PA7 · ADC1_7'], ['A6', 'ain', 'PA6 · ADC1_6'], ['A5', 'ain', 'PA5 · ADC1_5 · SPI1 SCK'], ['A4', 'ain', 'PA4 · ADC1_4'], ['A3', 'ain', 'PA3 · ADC1_3 · USART2 RX'], ['A2', 'ain', 'PA2 · ADC1_2 · USART2 TX'], ['A1', 'ain', 'PA1 · ADC1_1'], ['A0', 'ain', 'PA0 · ADC1_0'], ['C15', 'io', 'PC15'], ['C14', 'io', 'PC14'], ['C13', 'io', 'PC13 · onboard LED'], ['VB', 'vin', 'VBAT'], ['RSV', 'nc', 'Reserved']], 90, 20)
    ],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'ARM Cortex-M3 at 72 MHz with 64 KB flash / 20 KB RAM. 3.3 V logic, not 5 V tolerant on most pins. PC13 drives the onboard LED (active low). USB full-speed on PA11/PA12.',
    ratings: ['Logic 3.3 V', 'VIN 5 V via pin, 3.3 V regulator', 'Max 25 mA per GPIO'],
    art: { usb: true, buttons: [{ id: 'NRST', label: 'RST' }, { id: 'BOOT0', label: 'BOOT0' }], onboardLeds: [{ id: 'led', label: 'LED', pin: 'C13', color: 'blue' }], bodyColor: '#2b4d7a' }
  },
  {
    id: 'nodemcu-esp8266',
    category: 'boards',
    family: 'board',
    name: 'NodeMCU ESP8266 (v2)',
    partNumber: 'ESP-12E',
    w: 110,
    h: 230,
    pins: [
      ...colPins([['A0', 'ain', 'A0 · ADC 0–1 V (3.3 V max!)'], ['G', 'gnd', 'GND'], ['VU', 'vin', 'VU · 5 V (USB)'], ['S3', 'io', 'SD3 · GPIO10 (flash)'], ['S2', 'io', 'SD2 · GPIO9 (flash)'], ['S1', 'io', 'SD1 · GPIO8 (flash)'], ['SC', 'io', 'SCK · GPIO6 (flash)'], ['S0', 'io', 'SD0 · GPIO7 (flash)'], ['SK', 'io', 'CLK · GPIO6'], ['G2', 'gnd', 'GND'], ['3V3', 'vcc', '3.3 V'], ['EN', 'nc', 'EN · enable'], ['RST', 'nc', 'RST · reset'], ['G3', 'gnd', 'GND'], ['VIN', 'vin', 'VIN']], 0, 20),
      ...colPins([['D0', 'io', 'GPIO16 · D0 · WAKE'], ['D1', 'io', 'GPIO5 · D1 · SCL'], ['D2', 'io', 'GPIO4 · D2 · SDA'], ['D3', 'io', 'GPIO0 · D3 · FLASH'], ['D4', 'io', 'GPIO2 · D4 · LED'], ['3V3', 'vcc', '3.3 V'], ['G', 'gnd', 'GND'], ['D5', 'io', 'GPIO14 · D5 · SCK'], ['D6', 'io', 'GPIO12 · D6 · MISO'], ['D7', 'io', 'GPIO13 · D7 · MOSI'], ['D8', 'io', 'GPIO15 · D8 · SS'], ['RX', 'io', 'GPIO3 · RXD0'], ['TX', 'io', 'GPIO1 · TXD0'], ['G4', 'gnd', 'GND'], ['3V3B', 'vcc', '3.3 V'], ['RSV', 'nc', 'Reserved']], 90, 20)
    ],
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      'ESP8266 (ESP-12E) Wi-Fi module on a NodeMCU carrier with CP2102 USB-serial. Labels Dx map to GPIO numbers (D1 = GPIO5 = I²C SCL). A0 accepts only 0–1 V.',
    ratings: ['Logic 3.3 V — not 5 V tolerant', 'A0 input max 1.0 V', 'VIN 4.5–10 V via VIN'],
    art: { usb: true, buttons: [{ id: 'RST', label: 'RST' }, { id: 'FLASH', label: 'FLASH', pin: 'D3' }], onboardLeds: [{ id: 'led', label: 'LED', pin: 'D4', color: 'blue' }], antenna: true, bodyColor: '#24466b' }
  },
  {
    id: 'attiny85',
    category: 'boards',
    family: 'ic-dip',
    name: 'ATtiny85 (DIP-8)',
    partNumber: 'ATTINY85-20PU',
    ...dipSize(8),
    pins: dipPins(['PB5/RESET', 'PB3/A3', 'PB4/A2', 'GND', 'PB0/MOSI', 'PB1/MISO/LED', 'PB2/SCK/A1', 'VCC']),
    props: [{ key: 'code', label: 'Sketch', type: 'text' }],
    defaults: {},
    model: { type: 'mcu' },
    description:
      '8-bit AVR, 8 KB flash, 2 KB RAM, 6 usable I/O, 4-channel 10-bit ADC, Timer PWM. Programmed by ISP or via Arduino core. Pin 1 is RESET/PB5; PB1 is often wired to an LED.',
    ratings: ['VCC 1.8–5.5 V', 'Max 40 mA per I/O', 'Operating −40…85 °C'],
    art: { chipLabel: 'ATtiny85' }
  }
];

const prototyping: PartDef[] = [
  {
    id: 'breadboard-full',
    category: 'prototyping',
    family: 'breadboard',
    name: 'Breadboard (full, 830-point)',
    partNumber: 'BB-830',
    w: 650,
    h: 240,
    pins: breadboardPins(63),
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description:
      '63 columns × 5-hole strips split by a centre channel. Holes in the same column (a–e or f–j) are connected; the top and bottom power rails run the full length (+ red, − blue).',
    ratings: ['Max 1 A per hole (recommended)', 'Rails carry up to 1 A total', 'Use 0.6 mm pins, 22–24 AWG wire']
  },
  {
    id: 'breadboard-half',
    category: 'prototyping',
    family: 'breadboard-half',
    name: 'Breadboard (half, 400-point)',
    partNumber: 'BB-400',
    w: 330,
    h: 240,
    pins: breadboardPins(30),
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description:
      '30 columns with a centre channel and two power rails. Connectivity matches the full board: holes in a column strip are shared, rail rows are shared end to end.',
    ratings: ['Max 1 A per hole (recommended)', 'Rails carry up to 1 A total']
  },
  {
    id: 'perfboard',
    category: 'prototyping',
    family: 'perfboard',
    name: 'Perfboard (2.54 mm grid)',
    partNumber: 'PERF-20x30',
    w: 310,
    h: 210,
    pins: gridPins(20, 30, 'p'),
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description: 'Solder-through copper pads on a 2.54 mm grid. Every pad is isolated: connect pads with jumper wires or solder bridges.',
    ratings: ['Pads isolated (no strips)']
  },
  {
    id: 'stripboard',
    category: 'prototyping',
    family: 'perfboard',
    name: 'Stripboard (veroboard)',
    partNumber: 'VERO-20x30',
    w: 310,
    h: 210,
    pins: gridPins(20, 30, 's'),
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description: 'Copper strips run along one axis; every pad in a strip is connected. Cut strips with a drill bit to isolate sections (not modelled in this view).',
    ratings: ['Strip current ≤ 1 A recommended']
  },
  {
    id: 'pcb-area',
    category: 'prototyping',
    family: 'perfboard',
    name: 'PCB area (copper pads)',
    partNumber: 'PCB-CUSTOM',
    w: 200,
    h: 140,
    pins: gridPins(12, 18, 'p'),
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description: 'Custom PCB pad area. Each pad is an isolated copper land; route traces in PCB mode for a fabrication-style view.',
    ratings: ['Pads isolated']
  }
];

const passives: PartDef[] = [
  {
    id: 'resistor',
    category: 'passives',
    family: 'resistor',
    name: 'Resistor (axial, 1/4 W)',
    partNumber: 'CF-1/4W',
    ...twoLead(),
    pins: [P('a', '1', 0, 10, 'io', undefined, 'Lead A'), P('b', '2', 40, 10, 'io', undefined, 'Lead B')],
    props: [prop('ohms', 'Resistance', { min: 0.1, max: 10_000_000, step: 1, unit: 'Ω' }), prop('watts', 'Rating', { min: 0.125, max: 5, step: 0.125, unit: 'W' })],
    defaults: { ohms: 220, watts: 0.25 },
    model: { type: 'resistor' },
    description: 'Carbon-film through-hole resistor. Colour bands encode the value: first two digits, multiplier, tolerance (gold ±5 %).',
    ratings: ['Power rating 0.25 W', 'Tolerance ±5 %', 'Max working voltage 250 V']
  },
  {
    id: 'ceramic-cap',
    category: 'passives',
    family: 'capacitor-ceramic',
    name: 'Ceramic capacitor (disc)',
    partNumber: 'CC-100n-50V',
    w: 30,
    h: 30,
    pins: [P('a', '1', 10, 30, 'io', undefined, 'Lead 1 (non-polar)'), P('b', '2', 20, 30, 'io', undefined, 'Lead 2 (non-polar)')],
    props: [prop('farads', 'Capacitance', { min: 1e-12, max: 1e-3, step: 1e-9, unit: 'F' }), prop('volts', 'Voltage rating', { min: 6, max: 500, step: 1, unit: 'V' })],
    defaults: { farads: 100e-9, volts: 50 },
    model: { type: 'capacitor' },
    description: 'Non-polarised multilayer ceramic disc capacitor. Code: three digits, e.g. 104 = 10 × 10⁴ pF = 100 nF.',
    ratings: ['Rated 50 V DC (typical)', 'Non-polarised', 'Temp −25…85 °C (X7R)']
  },
  {
    id: 'electrolytic-cap',
    category: 'passives',
    family: 'capacitor-electrolytic',
    name: 'Electrolytic capacitor',
    partNumber: 'EC-100u-25V',
    w: 30,
    h: 50,
    pins: [P('pos', '+', 10, 40, 'io', undefined, '+ · anode (longer lead)'), P('neg', '−', 20, 40, 'io', undefined, '− · cathode (stripe side)')],
    props: [prop('farads', 'Capacitance', { min: 1e-9, max: 1, step: 1e-6, unit: 'F' }), prop('volts', 'Voltage rating', { min: 6, max: 450, step: 1, unit: 'V' })],
    defaults: { farads: 100e-6, volts: 25 },
    model: { type: 'capacitor', polarized: true },
    description: 'Aluminium electrolytic: polarised, the + lead must be at the higher voltage. Reverse voltage or exceeding the rating causes venting and failure.',
    ratings: ['Max reverse voltage ≈ 1 V', 'Rated 25 V DC', 'Ripple current per datasheet']
  },
  {
    id: 'inductor',
    category: 'passives',
    family: 'inductor',
    name: 'Inductor (axial)',
    partNumber: 'IND-100uH',
    w: 40,
    h: 20,
    pins: [P('a', '1', 0, 10, 'io', undefined, 'Lead A'), P('b', '2', 40, 10, 'io', undefined, 'Lead B')],
    props: [prop('henry', 'Inductance', { min: 1e-9, max: 1, step: 1e-6, unit: 'H' }), prop('ohm', 'DCR', { min: 0, max: 100, step: 0.1, unit: 'Ω' })],
    defaults: { henry: 100e-6, ohm: 0.5 },
    model: { type: 'inductor' },
    description: 'Wire-wound axial inductor. Stores energy in its magnetic field; the current cannot change instantly (τ = L/R with a series resistance).',
    ratings: ['Saturation current per datasheet', 'DCR as listed']
  },
  {
    id: 'potentiometer',
    category: 'passives',
    family: 'potentiometer',
    name: 'Potentiometer (10 kΩ, linear)',
    partNumber: 'RV-10K-B',
    w: 60,
    h: 60,
    pins: [P('cw', 'CW', 10, 60, 'io', undefined, 'End 1 (CW)'), P('wiper', 'W', 30, 60, 'io', undefined, 'Wiper'), P('ccw', 'CCW', 50, 60, 'io', undefined, 'End 2 (CCW)')],
    props: [prop('ohms', 'Total resistance', { min: 100, max: 1_000_000, step: 100, unit: 'Ω' }), prop('position', 'Wiper position', { min: 0, max: 100, step: 1, unit: '%' })],
    defaults: { ohms: 10000, position: 50 },
    model: { type: 'potentiometer' },
    description: 'Three-terminal rotary potentiometer. Wiper position divides the track into two resistors. Turn the knob in the inspector.',
    ratings: ['Max 0.2 W (linear)', 'Track 10 kΩ linear (B)']
  },
  {
    id: 'trimmer',
    category: 'passives',
    family: 'trimmer',
    name: 'Trimmer potentiometer (multi-turn)',
    partNumber: 'TRIM-10K',
    w: 40,
    h: 40,
    pins: [P('cw', 'CW', 10, 40, 'io', undefined, 'End 1'), P('wiper', 'W', 20, 40, 'io', undefined, 'Wiper'), P('ccw', 'CCW', 30, 40, 'io', undefined, 'End 2')],
    props: [prop('ohms', 'Total resistance', { min: 100, max: 1_000_000, step: 100, unit: 'Ω' }), prop('position', 'Wiper position', { min: 0, max: 100, step: 1, unit: '%' })],
    defaults: { ohms: 10000, position: 50 },
    model: { type: 'potentiometer' },
    description: 'Preset trimmer for calibration. Adjust with a screwdriver. Same model as a potentiometer.',
    ratings: ['Max 0.25 W', 'Track 10 kΩ']
  },
  {
    id: 'ldr',
    category: 'passives',
    family: 'ldr',
    name: 'LDR (photoresistor)',
    partNumber: 'GL5528',
    w: 40,
    h: 40,
    pins: [P('a', '1', 10, 40, 'io', undefined, 'Lead A'), P('b', '2', 30, 40, 'io', undefined, 'Lead B')],
    props: [prop('lux', 'Light level', { min: 0, max: 1000, step: 10, unit: 'lux' })],
    defaults: { lux: 200 },
    model: { type: 'resistor' },
    description: 'Cadmium-sulfide light-dependent resistor. Resistance falls from ~1 MΩ in darkness to a few kΩ in bright light. Set the light level in the inspector.',
    ratings: ['Peak 150 mW', 'Max voltage 150 V', 'Response time ~ 20 ms']
  },
  {
    id: 'thermistor',
    category: 'passives',
    family: 'thermistor',
    name: 'NTC thermistor (10 kΩ @25 °C)',
    partNumber: 'NTC-MF52-10K',
    w: 40,
    h: 40,
    pins: [P('a', '1', 10, 40, 'io', undefined, 'Lead A'), P('b', '2', 30, 40, 'io', undefined, 'Lead B')],
    props: [prop('celsius', 'Temperature', { min: -40, max: 125, step: 1, unit: '°C' })],
    defaults: { celsius: 25 },
    model: { type: 'resistor' },
    description: 'Negative temperature coefficient thermistor. Resistance drops as temperature rises (β ≈ 3950 K). Set temperature in the inspector.',
    ratings: ['R25 = 10 kΩ ±5 %', 'β = 3950 K', 'Max 125 °C']
  }
];

const LED_BODY = { w: 20, h: 40 };

function ledPart(id: string, name: string, color: string, vf: number, partNumber: string): PartDef {
  return {
    id,
    category: 'semiconductors',
    family: 'led',
    name,
    partNumber,
    ...LED_BODY,
    pins: [P('anode', 'A', 0, 30, 'io', undefined, 'Anode (+) · longer lead'), P('cathode', 'K', 10, 30, 'io', undefined, 'Cathode (−) · flat side')],
    props: [prop('vf', 'Forward voltage', { min: 1, max: 4, step: 0.1, unit: 'V' }), prop('imax', 'Max current', { min: 5, max: 30, step: 1, unit: 'mA' })],
    defaults: { vf, imax: 20, color },
    model: { type: 'led' },
    description: `5 mm ${color} LED. Brightness is proportional to forward current, not voltage: always use a series resistor (R = (Vsupply − Vf) / I). Anode is the longer lead.`,
    ratings: [`Typical Vf ${vf} V @ 20 mA`, 'Max continuous current 20–30 mA', 'Max reverse 5 V']
  };
}

const semiconductors: PartDef[] = [
  ledPart('led-red', 'LED (red, 5 mm)', 'red', 2.0, 'LED-R-5MM'),
  ledPart('led-yellow', 'LED (yellow, 5 mm)', 'yellow', 2.1, 'LED-Y-5MM'),
  ledPart('led-green', 'LED (green, 5 mm)', 'green', 2.2, 'LED-G-5MM'),
  ledPart('led-blue', 'LED (blue, 5 mm)', 'blue', 3.1, 'LED-B-5MM'),
  ledPart('led-white', 'LED (white, 5 mm)', 'white', 3.2, 'LED-W-5MM'),
  {
    id: 'led-rgb',
    category: 'semiconductors',
    family: 'led',
    name: 'RGB LED (common cathode)',
    partNumber: 'RGB-5MM-CC',
    w: 30,
    h: 40,
    pins: [P('r', 'R', 0, 30, 'io', undefined, 'Red anode'), P('k', 'K', 10, 30, 'io', undefined, 'Common cathode (longest)'), P('g', 'G', 20, 30, 'io', undefined, 'Green anode'), P('b', 'B', 30, 30, 'io', undefined, 'Blue anode')],
    props: [prop('imax', 'Max current / channel', { min: 5, max: 30, step: 1, unit: 'mA' })],
    defaults: { imax: 20, color: 'rgb' },
    model: { type: 'led' },
    description: 'Three LED dies in one package with a common cathode. Each colour needs its own series resistor. Glow intensity follows each die’s current.',
    ratings: ['Vf R ≈ 2.0 V, G/B ≈ 3.2 V', 'Max 20 mA per channel', 'Common cathode is the longest lead']
  },
  {
    id: 'diode-1n4007',
    category: 'semiconductors',
    family: 'diode',
    name: 'Rectifier diode (1N4007)',
    partNumber: '1N4007',
    w: 40,
    h: 20,
    pins: [P('anode', 'A', 0, 10, 'io', undefined, 'Anode'), P('cathode', 'K', 40, 10, 'io', undefined, 'Cathode (band)')],
    props: [],
    defaults: {},
    model: { type: 'diode', vf: 0.7 },
    description: 'General-purpose 1 A silicon rectifier. Current flows anode → cathode. The band marks the cathode. Vf ≈ 0.7 V at 1 A.',
    ratings: ['Peak reverse 1000 V', 'Average forward 1 A', 'Surge 30 A (8.3 ms)']
  },
  {
    id: 'zener-5v1',
    category: 'semiconductors',
    family: 'diode',
    name: 'Zener diode (5.1 V)',
    partNumber: '1N4733A',
    w: 40,
    h: 20,
    pins: [P('anode', 'A', 0, 10, 'io', undefined, 'Anode'), P('cathode', 'K', 40, 10, 'io', undefined, 'Cathode (band)')],
    props: [prop('vz', 'Zener voltage', { min: 2.4, max: 30, step: 0.1, unit: 'V' })],
    defaults: { vz: 5.1 },
    model: { type: 'diode', vf: 0.7 },
    description: 'Zener diode for voltage reference. Conducts in reverse above Vz and holds the voltage near Vz (1 W, 5.1 V). Put a series resistor in front of it.',
    ratings: ['Pd 1 W', 'Vz 5.1 V ±5 %', 'Iz min 5 mA']
  },
  {
    id: 'bc547',
    category: 'semiconductors',
    family: 'transistor',
    name: 'NPN transistor BC547',
    partNumber: 'BC547B',
    w: 40,
    h: 40,
    pins: [P('c', 'C', 0, 10, 'io', undefined, 'Collector'), P('b', 'B', 10, 30, 'io', undefined, 'Base'), P('e', 'E', 20, 10, 'io', undefined, 'Emitter')],
    props: [prop('beta', 'hFE (gain)', { min: 20, max: 800, step: 10 })],
    defaults: { beta: 200 },
    model: { type: 'bjt' },
    description: 'General-purpose NPN small-signal transistor (TO-92). Base-emitter ~0.7 V turns it on; Ic ≈ β·Ib in the active region, saturating near Vce ≈ 0.2 V.',
    ratings: ['Vce 45 V', 'Ic max 100 mA', 'hFE 200–450 (B group)', 'Ptot 500 mW']
  },
  {
    id: 'bc557',
    category: 'semiconductors',
    family: 'transistor',
    name: 'PNP transistor BC557',
    partNumber: 'BC557B',
    w: 40,
    h: 40,
    pins: [P('c', 'C', 0, 10, 'io', undefined, 'Collector'), P('b', 'B', 10, 30, 'io', undefined, 'Base'), P('e', 'E', 20, 10, 'io', undefined, 'Emitter')],
    props: [prop('beta', 'hFE (gain)', { min: 20, max: 800, step: 10 })],
    defaults: { beta: 200 },
    model: { type: 'bjt', pnp: true },
    description: 'PNP complement of the BC547, for high-side switches. Emitter at the higher voltage; base pulled below the emitter turns it on.',
    ratings: ['Vce −45 V', 'Ic max −100 mA', 'Ptot 500 mW']
  },
  {
    id: '2n2222',
    category: 'semiconductors',
    family: 'transistor',
    name: 'NPN transistor 2N2222',
    partNumber: '2N2222A',
    w: 40,
    h: 40,
    pins: [P('e', 'E', 0, 10, 'io', undefined, 'Emitter'), P('b', 'B', 10, 30, 'io', undefined, 'Base'), P('c', 'C', 20, 10, 'io', undefined, 'Collector')],
    props: [prop('beta', 'hFE (gain)', { min: 20, max: 800, step: 10 })],
    defaults: { beta: 150 },
    model: { type: 'bjt' },
    description: 'NPN switching transistor. Faster and higher-current than the BC547 (Ic max 800 mA). Note the pin order E-B-C on this TO-92 package.',
    ratings: ['Vce 40 V', 'Ic max 600 mA', 'Ptot 625 mW']
  },
  {
    id: 'tip120',
    category: 'semiconductors',
    family: 'transistor',
    name: 'Darlington TIP120',
    partNumber: 'TIP120',
    w: 40,
    h: 40,
    pins: [P('b', 'B', 0, 10, 'io', undefined, 'Base'), P('c', 'C', 10, 30, 'io', undefined, 'Collector (tab)'), P('e', 'E', 20, 10, 'io', undefined, 'Emitter')],
    props: [prop('beta', 'hFE (gain)', { min: 500, max: 20000, step: 100 })],
    defaults: { beta: 1000 },
    model: { type: 'bjt' },
    description: 'NPN Darlington power transistor (TO-220). Very high gain (≈1000) lets a microcontroller pin drive motors and relays. Needs a flyback diode for inductive loads. Vce(sat) ≈ 2 V.',
    ratings: ['Vce 60 V', 'Ic max 5 A', 'Ptot 65 W (with heatsink)', 'Vce(sat) ≈ 2 V']
  },
  {
    id: 'irf540',
    category: 'semiconductors',
    family: 'mosfet',
    name: 'N-MOSFET IRF540',
    partNumber: 'IRF540N',
    w: 40,
    h: 40,
    pins: [P('g', 'G', 0, 10, 'io', undefined, 'Gate'), P('d', 'D', 10, 30, 'io', undefined, 'Drain (tab)'), P('s', 'S', 20, 10, 'io', undefined, 'Source')],
    props: [prop('rdson', 'Rds(on)', { min: 0.001, max: 1, step: 0.001, unit: 'Ω' }), prop('vth', 'Vgs(th)', { min: 1, max: 4, step: 0.1, unit: 'V' })],
    defaults: { rdson: 0.044, vth: 2.5 },
    model: { type: 'mosfet' },
    description: 'Power N-channel MOSFET (TO-220). Voltage-controlled: Vgs above ~2.5 V turns it on hard. Logic-level gate drive is NOT guaranteed; use a logic-level part for 3.3 V MCUs.',
    ratings: ['Vds 100 V', 'Id 33 A', 'Rds(on) 44 mΩ @ Vgs 10 V', 'Vgs ±20 V']
  },
  {
    id: '2n7000',
    category: 'semiconductors',
    family: 'mosfet',
    name: 'N-MOSFET 2N7000',
    partNumber: '2N7000',
    w: 40,
    h: 40,
    pins: [P('s', 'S', 0, 10, 'io', undefined, 'Source'), P('g', 'G', 10, 30, 'io', undefined, 'Gate'), P('d', 'D', 20, 10, 'io', undefined, 'Drain')],
    props: [prop('rdson', 'Rds(on)', { min: 0.1, max: 10, step: 0.1, unit: 'Ω' }), prop('vth', 'Vgs(th)', { min: 0.8, max: 3, step: 0.1, unit: 'V' })],
    defaults: { rdson: 5, vth: 2.1 },
    model: { type: 'mosfet' },
    description: 'Small-signal N-MOSFET (TO-92), logic-level compatible: turns on from ~2 V so a 5 V (and nearly 3.3 V) GPIO can switch 200 mA loads.',
    ratings: ['Vds 60 V', 'Id 200 mA', 'Rds(on) 5 Ω @ 10 V', 'Vgs ±20 V']
  },
  {
    id: 'reg-7805',
    category: 'semiconductors',
    family: 'regulator',
    name: 'Linear regulator 7805 (5 V)',
    partNumber: 'L7805CV',
    w: 40,
    h: 40,
    pins: [P('in', 'IN', 0, 10, 'vin', undefined, 'Input (7–35 V)'), P('gnd', 'GND', 10, 30, 'gnd', undefined, 'Ground (common)'), P('out', 'OUT', 20, 10, 'vcc', undefined, 'Output 5 V')],
    props: [prop('vout', 'Output', { min: 3, max: 12, step: 0.1, unit: 'V' })],
    defaults: { vout: 5 },
    model: { type: 'regulator' },
    description: 'Linear 5 V regulator (TO-220). Needs ≥ 2.5 V headroom and ~0.33 µF/0.1 µF caps on input and output. Dissipates (Vin − 5) × I as heat.',
    ratings: ['Vin max 35 V', 'Iout 1.5 A', 'Dropout ~2 V', 'Tj max 125 °C']
  },
  {
    id: 'reg-ams1117',
    category: 'semiconductors',
    family: 'regulator',
    name: 'LDO AMS1117-3.3',
    partNumber: 'AMS1117-3.3',
    w: 40,
    h: 40,
    pins: [P('gnd', 'GND', 0, 10, 'gnd', undefined, 'Ground / adjust'), P('out', 'VOUT', 10, 30, 'vcc', undefined, 'Output 3.3 V'), P('in', 'VIN', 20, 10, 'vin', undefined, 'Input (4.5–12 V)')],
    props: [prop('vout', 'Output', { min: 1.2, max: 5, step: 0.1, unit: 'V' })],
    defaults: { vout: 3.3 },
    model: { type: 'regulator' },
    description: 'Low-dropout 3.3 V regulator (SOT-223 style pinout shown). Dropout ≈ 1.1 V at 800 mA. Use 10 µF output capacitor for stability.',
    ratings: ['Vin max 15 V', 'Iout 1 A', 'Dropout 1.1 V @ 1 A']
  },
  {
    id: 'reg-lm317',
    category: 'semiconductors',
    family: 'regulator',
    name: 'Adjustable regulator LM317',
    partNumber: 'LM317T',
    w: 40,
    h: 40,
    pins: [P('adj', 'ADJ', 0, 10, 'io', undefined, 'Adjust'), P('out', 'OUT', 10, 30, 'vcc', undefined, 'Output'), P('in', 'IN', 20, 10, 'vin', undefined, 'Input')],
    props: [prop('vout', 'Target output', { min: 1.25, max: 30, step: 0.05, unit: 'V' })],
    defaults: { vout: 5 },
    model: { type: 'regulator' },
    description: 'Adjustable linear regulator: Vout = 1.25 V × (1 + R2/R1) with R1 = 240 Ω from OUT to ADJ. Set the target output in the inspector.',
    ratings: ['Vin − Vout max 40 V', 'Iout 1.5 A', 'Vref 1.25 V']
  },
  {
    id: 'pc817',
    category: 'semiconductors',
    family: 'optocoupler',
    name: 'Optocoupler PC817',
    partNumber: 'PC817C',
    w: 50,
    h: 40,
    pins: [P('a', 'A', 0, 10, 'io', undefined, 'LED anode'), P('k', 'K', 0, 30, 'io', undefined, 'LED cathode'), P('c', 'C', 40, 10, 'io', undefined, 'Phototransistor collector'), P('e', 'E', 40, 30, 'io', undefined, 'Phototransistor emitter')],
    props: [prop('ctr', 'CTR', { min: 50, max: 600, step: 10, unit: '%' })],
    defaults: { ctr: 200 },
    model: { type: 'optocoupler' },
    description: 'Optical isolator: an LED drives a phototransistor across a 5 kV isolation barrier. Current transfer ratio (CTR) ≈ 100–200 %.',
    ratings: ['Isolation 5 kVrms', 'If 50 mA', 'Vceo 35 V', 'CTR 50–600 %']
  }
];

const ICS: PartDef[] = [
  {
    id: 'ne555',
    category: 'ics',
    family: 'ic-dip',
    name: '555 timer',
    partNumber: 'NE555P',
    ...dipSize(8),
    pins: dipPins(['GND', 'TRIG', 'OUT', 'RESET', 'CTRL', 'THR', 'DIS', 'VCC']),
    props: [prop('vcc', 'Supply', { min: 4.5, max: 16, step: 0.1, unit: 'V' })],
    defaults: { vcc: 5 },
    model: { type: 'timer555' },
    description: 'Classic 555 timer. Astable: f = 1.44 / ((R1 + 2·R2)·C). Monostable: T = 1.1·R·C. OUT drives up to 200 mA. Wire RESET high (VCC) when unused.',
    ratings: ['VCC 4.5–16 V', 'Output 200 mA', 'Timing error ±1 %']
  },
  {
    id: 'lm358',
    category: 'ics',
    family: 'ic-dip',
    name: 'Dual op-amp LM358',
    partNumber: 'LM358N',
    ...dipSize(8),
    pins: dipPins(['OUT1', 'IN1-', 'IN1+', 'GND', 'IN2+', 'IN2-', 'OUT2', 'VCC']),
    props: [prop('vcc', 'Supply', { min: 3, max: 32, step: 0.1, unit: 'V' })],
    defaults: { vcc: 5 },
    model: { type: 'opamp' },
    description: 'Dual single-supply op-amp. Output swings close to GND (rail-to-ground in common-mode). Use feedback to set gain: G = 1 + Rf/Rin for non-inverting.',
    ratings: ['VCC 3–32 V', 'GBW 1 MHz', 'Input offset ±2 mV']
  },
  {
    id: 'lm741',
    category: 'ics',
    family: 'ic-dip',
    name: 'Op-amp LM741',
    partNumber: 'UA741CN',
    ...dipSize(8),
    pins: dipPins(['OFFSET', 'IN-', 'IN+', 'V-', 'OFFSET2', 'OUT', 'V+', 'NC']),
    props: [prop('vcc', 'Supply (±)', { min: 5, max: 18, step: 0.5, unit: 'V' })],
    defaults: { vcc: 12 },
    model: { type: 'opamp' },
    description: 'Classic general-purpose op-amp requiring split supplies (±12–15 V). Output saturates ~1 V inside the rails. Compensation is internal.',
    ratings: ['±18 V max', 'GBW 1 MHz', 'Slew 0.5 V/µs']
  },
  {
    id: '74hc00',
    category: 'ics',
    family: 'ic-dip',
    name: 'Quad NAND 74HC00',
    partNumber: 'SN74HC00N',
    ...dipSize(14),
    pins: dipPins(['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC']),
    props: [],
    defaults: {},
    model: { type: 'logic', gate: 'nand' },
    description: 'Four 2-input NAND gates. Y = NOT(A AND B). Y goes LOW only when both inputs are HIGH. Use VCC 2–6 V; unused inputs must not float.',
    ratings: ['VCC 2–6 V', 'Output 25 mA', 'tpd ≈ 8 ns']
  },
  {
    id: '74hc08',
    category: 'ics',
    family: 'ic-dip',
    name: 'Quad AND 74HC08',
    partNumber: 'SN74HC08N',
    ...dipSize(14),
    pins: dipPins(['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC']),
    props: [],
    defaults: {},
    model: { type: 'logic', gate: 'and' },
    description: 'Four 2-input AND gates: Y = A AND B. Same pinout as the 74HC00.',
    ratings: ['VCC 2–6 V', 'Output 25 mA']
  },
  {
    id: '74hc04',
    category: 'ics',
    family: 'ic-dip',
    name: 'Hex inverter 74HC04',
    partNumber: 'SN74HC04N',
    ...dipSize(14),
    pins: dipPins(['1A', '1Y', '2A', '2Y', '3A', '3Y', 'GND', '4Y', '4A', '5Y', '5A', '6Y', '6A', 'VCC']),
    props: [],
    defaults: {},
    model: { type: 'logic', gate: 'not' },
    description: 'Six NOT gates (inverters). Y = NOT A. Useful as Schmitt-free buffers and for oscillators.',
    ratings: ['VCC 2–6 V', 'Output 25 mA']
  },
  {
    id: '74hc595',
    category: 'ics',
    family: 'ic-dip',
    name: 'Shift register 74HC595',
    partNumber: 'SN74HC595N',
    ...dipSize(16),
    pins: dipPins(['QB', 'QC', 'QD', 'QE', 'QF', 'QG', 'QH', 'GND', 'QH_S', 'SRCLR', 'SRCLK', 'RCLK', 'OE', 'SER', 'QA', 'VCC']),
    props: [],
    defaults: {},
    model: { type: 'logic', gate: 'buffer' },
    description: '8-bit serial-in, parallel-out shift register with output latch. Clock bits on SRCLK (rising edge), latch on RCLK. Daisy-chain via QH′. Ideal for driving 8 LEDs from 3 pins.',
    ratings: ['VCC 2–6 V', '±35 mA per output', 'fmax ≈ 100 MHz @ 5 V']
  },
  {
    id: 'l293d',
    category: 'ics',
    family: 'ic-dip',
    name: 'Motor driver L293D',
    partNumber: 'L293DNE',
    ...dipSize(16),
    pins: dipPins(['EN1', 'IN1', 'OUT1', 'GND', 'GND', 'OUT2', 'IN2', 'VCC2', 'VCC1_CH', 'IN3', 'OUT3', 'GND', 'GND', 'OUT4', 'IN4', 'VCC1']),
    props: [],
    defaults: {},
    model: { type: 'driver', variant: 'l293d' },
    description: 'Dual H-bridge, 600 mA per channel (1.2 A peak). Enable pin ENx gates each bridge; IN pins choose direction. Add flyback diodes for inductive loads.',
    ratings: ['VCC2 (logic) 4.5–7 V', 'VCC1 (motor) up to 36 V', '600 mA continuous per channel']
  },
  {
    id: 'uln2003',
    category: 'ics',
    family: 'ic-dip',
    name: 'Darlington array ULN2003',
    partNumber: 'ULN2003A',
    ...dipSize(16),
    pins: dipPins(['IN1', 'IN2', 'IN3', 'IN4', 'IN5', 'IN6', 'IN7', 'GND', 'COM', 'OUT7', 'OUT6', 'OUT5', 'OUT4', 'OUT3', 'OUT2', 'OUT1']),
    props: [],
    defaults: {},
    model: { type: 'driver', variant: 'uln2003' },
    description: 'Seven Darlington pairs with built-in flyback clamp diodes (COM to the motor supply). Inverts: a HIGH input pulls the output LOW. Drives relays, stepper coils, lamps.',
    ratings: ['500 mA per channel', '50 V output', 'Input 5–12 V']
  },
  {
    id: 'mcp3008',
    category: 'ics',
    family: 'ic-dip',
    name: 'ADC MCP3008 (8-ch, 10-bit)',
    partNumber: 'MCP3008-I/P',
    ...dipSize(16),
    pins: dipPins(['CH0', 'CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'DGND', 'CS/SHDN', 'DIN', 'DOUT', 'CLK', 'AGND', 'VREF', 'VDD']),
    props: [prop('vref', 'VREF', { min: 1, max: 5.5, step: 0.1, unit: 'V' })],
    defaults: { vref: 3.3 },
    model: { type: 'mcu' },
    description: 'Eight-channel 10-bit SAR ADC with SPI interface. Reads 0…VREF in 1024 steps. Connect CS, DIN, DOUT and CLK to the MCU SPI pins.',
    ratings: ['VDD 2.7–5.5 V', 'Sample rate 200 ksps', '10-bit resolution']
  }
];

const sensors: PartDef[] = [
  {
    id: 'dht11',
    category: 'sensors',
    family: 'module',
    name: 'DHT11 temperature & humidity',
    partNumber: 'DHT11',
    w: 50,
    h: 60,
    pins: [P('vcc', 'VCC', 10, 60, 'vcc', undefined, 'VCC 3–5.5 V'), P('data', 'DATA', 20, 60, 'io', undefined, 'Data (1-wire, needs 10 kΩ pull-up)'), P('nc', 'NC', 30, 60, 'nc', undefined, 'Not connected'), P('gnd', 'GND', 40, 60, 'gnd', undefined, 'GND')],
    props: [prop('celsius', 'Temperature', { min: -20, max: 60, step: 0.5, unit: '°C' }), prop('humidity', 'Humidity', { min: 0, max: 100, step: 1, unit: '%' })],
    defaults: { celsius: 24, humidity: 55 },
    model: { type: 'sensor', variant: 'dht' },
    description: 'Basic digital temperature (±2 °C, 1 °C resolution) and humidity (±5 %) sensor. Single-wire protocol at 1 Hz max sample rate. Needs a 10 kΩ pull-up on DATA.',
    ratings: ['VCC 3–5.5 V', 'Range 0–50 °C, 20–90 %RH', 'Sample ≤ 1 Hz']
  },
  {
    id: 'dht22',
    category: 'sensors',
    family: 'module',
    name: 'DHT22 / AM2302',
    partNumber: 'DHT22',
    w: 50,
    h: 60,
    pins: [P('vcc', 'VCC', 10, 60, 'vcc', undefined, 'VCC 3.3–6 V'), P('data', 'DATA', 20, 60, 'io', undefined, 'Data (needs 10 kΩ pull-up)'), P('nc', 'NC', 30, 60, 'nc', undefined, 'Not connected'), P('gnd', 'GND', 40, 60, 'gnd', undefined, 'GND')],
    props: [prop('celsius', 'Temperature', { min: -40, max: 80, step: 0.1, unit: '°C' }), prop('humidity', 'Humidity', { min: 0, max: 100, step: 0.1, unit: '%' })],
    defaults: { celsius: 22.5, humidity: 48 },
    model: { type: 'sensor', variant: 'dht' },
    description: 'Higher-accuracy DHT sensor: ±0.5 °C, ±2–5 %RH, range −40…80 °C. Same one-wire protocol as the DHT11, sample rate 0.5 Hz.',
    ratings: ['VCC 3.3–6 V', 'Range −40…80 °C, 0–100 %RH', 'Sample ≤ 0.5 Hz']
  },
  {
    id: 'hc-sr04',
    category: 'sensors',
    family: 'module',
    name: 'HC-SR04 ultrasonic',
    partNumber: 'HC-SR04',
    w: 90,
    h: 40,
    pins: [P('vcc', 'VCC', 10, 40, 'vcc', undefined, '5 V'), P('trig', 'TRIG', 30, 40, 'io', undefined, 'Trigger: 10 µs HIGH pulse'), P('echo', 'ECHO', 50, 40, 'io', undefined, 'Echo: HIGH for round-trip time'), P('gnd', 'GND', 70, 40, 'gnd', undefined, 'GND')],
    props: [prop('distance', 'Object distance', { min: 2, max: 400, step: 1, unit: 'cm' })],
    defaults: { distance: 50 },
    model: { type: 'sensor', variant: 'hcsr04' },
    description: 'Ultrasonic ranging, 2–400 cm. Send a 10 µs pulse on TRIG; ECHO goes HIGH for the round-trip time. Distance (cm) = duration µs / 58.',
    ratings: ['VCC 5 V', 'Range 2–400 cm', 'Accuracy 3 mm', 'ECHO is 5 V — use a divider for 3.3 V MCUs']
  },
  {
    id: 'pir-hc501',
    category: 'sensors',
    family: 'module',
    name: 'PIR motion sensor (HC-SR501)',
    partNumber: 'HC-SR501',
    w: 60,
    h: 50,
    pins: [P('gnd', 'GND', 10, 50, 'gnd', undefined, 'GND'), P('out', 'OUT', 20, 50, 'io', undefined, 'Output: HIGH when motion'), P('vcc', 'VCC', 30, 50, 'vcc', undefined, '4.5–20 V')],
    props: [prop('motion', 'Motion detected', { type: 'boolean' })],
    defaults: { motion: false },
    model: { type: 'sensor', variant: 'pir' },
    description: 'Passive infrared motion detector. Output goes HIGH for a few seconds after motion. Tick "Motion detected" in the inspector to trigger it.',
    ratings: ['VCC 4.5–20 V', 'Output 3.3 V logic', 'Range ~7 m']
  },
  {
    id: 'ir-receiver',
    category: 'sensors',
    family: 'module',
    name: 'IR receiver VS1838B',
    partNumber: 'VS1838B',
    w: 40,
    h: 40,
    pins: [P('out', 'OUT', 10, 40, 'io', undefined, 'Demodulated output (active low)'), P('gnd', 'GND', 20, 40, 'gnd', undefined, 'GND'), P('vcc', 'VCC', 30, 40, 'vcc', undefined, '2.7–5.5 V')],
    props: [],
    defaults: {},
    model: { type: 'sensor', variant: 'ir' },
    description: 'Demodulating 38 kHz IR receiver. Output idles HIGH and pulls LOW when a carrier burst is received. Use with a NEC remote.',
    ratings: ['VCC 2.7–5.5 V', 'Carrier 38 kHz', 'Range ~ 15 m']
  },
  {
    id: 'mpu6050',
    category: 'sensors',
    family: 'module',
    name: 'MPU-6050 accelerometer + gyro',
    partNumber: 'MPU-6050',
    w: 70,
    h: 60,
    pins: [P('vcc', 'VCC', 10, 60, 'vcc', undefined, '3.3–5 V'), P('gnd', 'GND', 20, 60, 'gnd', undefined, 'GND'), P('scl', 'SCL', 30, 60, 'io', undefined, 'I²C clock'), P('sda', 'SDA', 40, 60, 'io', undefined, 'I²C data'), P('xda', 'XDA', 50, 60, 'nc', undefined, 'Aux I²C data'), P('xcl', 'XCL', 60, 60, 'nc', undefined, 'Aux I²C clock'), P('ad0', 'AD0', 70, 60, 'io', undefined, 'I²C address select (0x68/0x69)'), P('int', 'INT', 80, 60, 'io', undefined, 'Interrupt')],
    props: [prop('ax', 'Accel X', { min: -2, max: 2, step: 0.01, unit: 'g' }), prop('ay', 'Accel Y', { min: -2, max: 2, step: 0.01, unit: 'g' }), prop('az', 'Accel Z', { min: -2, max: 2, step: 0.01, unit: 'g' })],
    defaults: { ax: 0, ay: 0, az: 1 },
    model: { type: 'sensor', variant: 'mpu6050' },
    description: '6-axis IMU with I²C address 0x68 (0x69 when AD0 is high). Set the tilt/acceleration in the inspector. Sketches read it over Wire.',
    ratings: ['VCC 3–5 V', 'Accel ±2/4/8/16 g', 'Gyro ±250…2000 °/s']
  },
  {
    id: 'bmp280',
    category: 'sensors',
    family: 'module',
    name: 'BMP280 pressure & temp',
    partNumber: 'BMP280',
    w: 60,
    h: 50,
    pins: [P('vcc', 'VCC', 10, 50, 'vcc', undefined, '1.8–3.6 V'), P('gnd', 'GND', 20, 50, 'gnd', undefined, 'GND'), P('scl', 'SCL', 30, 50, 'io', undefined, 'I²C clock'), P('sda', 'SDA', 40, 50, 'io', undefined, 'I²C data'), P('csb', 'CSB', 50, 50, 'nc', undefined, 'Chip select (high = I²C)')],
    props: [prop('hpa', 'Pressure', { min: 300, max: 1100, step: 0.1, unit: 'hPa' }), prop('celsius', 'Temperature', { min: -40, max: 85, step: 0.1, unit: '°C' })],
    defaults: { hpa: 1013.25, celsius: 25 },
    model: { type: 'sensor', variant: 'bmp280' },
    description: 'Barometric pressure and temperature sensor, I²C address 0x76 (0x77 if SDO high). Altitude ≈ 44330 · (1 − (P/P0)^0.1903) m.',
    ratings: ['VCC 1.8–3.6 V (module: 3.3 V)', 'Range 300–1100 hPa', 'Resolution 0.16 Pa']
  },
  {
    id: 'soil-moisture',
    category: 'sensors',
    family: 'module',
    name: 'Soil moisture sensor',
    partNumber: 'HL-69',
    w: 60,
    h: 70,
    pins: [P('vcc', 'VCC', 10, 70, 'vcc', undefined, '3.3–5 V'), P('gnd', 'GND', 20, 70, 'gnd', undefined, 'GND'), P('ao', 'AO', 30, 70, 'ain', undefined, 'Analog out (0 V wet … 5 V dry on some modules)'), P('do', 'DO', 40, 70, 'io', undefined, 'Digital out (threshold)')],
    props: [prop('moisture', 'Soil moisture', { min: 0, max: 100, step: 1, unit: '%' })],
    defaults: { moisture: 40 },
    model: { type: 'sensor', variant: 'soil' },
    description: 'Resistive soil moisture probe. More water → lower resistance → lower analog voltage. Calibrate for your soil; the DO pin trips at a threshold set by the on-board pot.',
    ratings: ['VCC 3.3–5 V', 'Probe corrodes if powered continuously']
  },
  {
    id: 'ldr-module',
    category: 'sensors',
    family: 'module',
    name: 'LDR light sensor module',
    partNumber: 'LDR-MOD-4P',
    w: 50,
    h: 60,
    pins: [P('vcc', 'VCC', 10, 60, 'vcc', undefined, '3.3–5 V'), P('gnd', 'GND', 20, 60, 'gnd', undefined, 'GND'), P('do', 'DO', 30, 60, 'io', undefined, 'Digital out (threshold)'), P('ao', 'AO', 40, 60, 'ain', undefined, 'Analog out (divider)')],
    props: [prop('lux', 'Light level', { min: 0, max: 1000, step: 10, unit: 'lux' })],
    defaults: { lux: 300 },
    model: { type: 'sensor', variant: 'ldr-module' },
    description: 'LDR voltage divider with comparator. AO rises with darkness on most modules. Set the light level in the inspector.',
    ratings: ['VCC 3.3–5 V', 'Comparator LM393']
  },
  {
    id: 'relay-5v',
    category: 'sensors',
    family: 'module',
    name: 'Relay module (5 V, 1-ch)',
    partNumber: 'SRD-05VDC-SL-C',
    w: 80,
    h: 70,
    pins: [P('vcc', 'VCC', 10, 70, 'vcc', undefined, '5 V coil'), P('gnd', 'GND', 20, 70, 'gnd', undefined, 'GND'), P('in', 'IN', 30, 70, 'io', undefined, 'Input (active low on most modules)'), P('com', 'COM', 50, 0, 'io', undefined, 'Common contact'), P('no', 'NO', 60, 0, 'io', undefined, 'Normally open'), P('nc', 'NC', 70, 0, 'io', undefined, 'Normally closed')],
    props: [],
    defaults: {},
    model: { type: 'relay' },
    description: 'SPDT 10 A relay on a driver board. Energising the coil closes NO to COM. Use a flyback diode (on the board) for the coil; the board is opto-isolated on most variants.',
    ratings: ['Coil 5 V, ~70 mA', 'Contacts 10 A @ 250 VAC / 30 VDC', 'Trigger current 15–20 mA']
  },
  {
    id: 'mq2',
    category: 'sensors',
    family: 'module',
    name: 'MQ-2 gas sensor',
    partNumber: 'MQ-2',
    w: 60,
    h: 70,
    pins: [P('vcc', 'VCC', 10, 70, 'vcc', undefined, '5 V heater'), P('gnd', 'GND', 20, 70, 'gnd', undefined, 'GND'), P('do', 'DO', 30, 70, 'io', undefined, 'Digital threshold'), P('ao', 'AO', 40, 70, 'ain', undefined, 'Analog (ppm)')],
    props: [prop('ppm', 'Gas concentration', { min: 0, max: 1000, step: 10, unit: 'ppm' })],
    defaults: { ppm: 200 },
    model: { type: 'sensor', variant: 'mq' },
    description: 'Metal-oxide sensor for LPG, smoke and hydrogen. Needs ~24 h burn-in and a warm-up (~20 s). Analog output rises with gas concentration.',
    ratings: ['Heater 5 V, ~800 mW', 'Detect 300–10000 ppm LPG']
  },
  {
    id: 'touch-ttp223',
    category: 'sensors',
    family: 'module',
    name: 'Capacitive touch (TTP223)',
    partNumber: 'TTP223',
    w: 40,
    h: 40,
    pins: [P('vcc', 'VCC', 10, 40, 'vcc', undefined, '2–5.5 V'), P('out', 'OUT', 20, 40, 'io', undefined, 'HIGH while touched'), P('gnd', 'GND', 30, 40, 'gnd', undefined, 'GND')],
    props: [prop('touched', 'Touched', { type: 'boolean' })],
    defaults: { touched: false },
    model: { type: 'sensor', variant: 'touch' },
    description: 'Single-key capacitive touch sensor. OUT goes HIGH while touched (non-latching). Tick "Touched" to simulate a finger.',
    ratings: ['VCC 2–5.5 V', 'Current 2 mA', 'OUT 3.3 V / 5 V logic']
  },
  {
    id: 'oled-ssd1306',
    category: 'sensors',
    family: 'module',
    name: 'OLED 0.96" SSD1306 (I²C)',
    partNumber: 'SSD1306-128x64',
    w: 110,
    h: 110,
    pins: [P('gnd', 'GND', 10, 110, 'gnd', undefined, 'GND'), P('vcc', 'VCC', 20, 110, 'vcc', undefined, '3.3 V (module: 3.3–5 V)'), P('scl', 'SCL', 30, 110, 'io', undefined, 'I²C clock (0x3C)'), P('sda', 'SDA', 40, 110, 'io', undefined, 'I²C data')],
    props: [prop('text', 'Text on screen', { type: 'text' })],
    defaults: { text: '' },
    model: { type: 'display', variant: 'oled' },
    description: '128×64 monochrome OLED driven by SSD1306 over I²C at address 0x3C. Sketches draw text with a Wire-based command helper; the simulator renders what the sketch sends.',
    ratings: ['VCC 3.3–5 V', 'Current ~20 mA lit', 'I²C 400 kHz']
  },
  {
    id: 'lcd-16x2',
    category: 'sensors',
    family: 'module',
    name: 'LCD 16×2 (HD44780, parallel)',
    partNumber: 'LCD1602A',
    w: 190,
    h: 100,
    pins: [
      P('vss', 'VSS', 10, 100, 'gnd', undefined, 'Pin 1 · GND'),
      P('vdd', 'VDD', 20, 100, 'vcc', undefined, 'Pin 2 · +5 V'),
      P('v0', 'V0', 30, 100, 'io', undefined, 'Pin 3 · contrast (wiper of 10 kΩ pot)'),
      P('rs', 'RS', 40, 100, 'io', undefined, 'Pin 4 · register select'),
      P('rw', 'RW', 50, 100, 'io', undefined, 'Pin 5 · read/write (tie to GND)'),
      P('e', 'E', 60, 100, 'io', undefined, 'Pin 6 · enable'),
      P('d0', 'D0', 70, 100, 'io', undefined, 'Pin 7 · data 0'),
      P('d1', 'D1', 80, 100, 'io', undefined, 'Pin 8 · data 1'),
      P('d2', 'D2', 90, 100, 'io', undefined, 'Pin 9 · data 2'),
      P('d3', 'D3', 100, 100, 'io', undefined, 'Pin 10 · data 3'),
      P('d4', 'D4', 110, 100, 'io', undefined, 'Pin 11 · data 4'),
      P('d5', 'D5', 120, 100, 'io', undefined, 'Pin 12 · data 5'),
      P('d6', 'D6', 130, 100, 'io', undefined, 'Pin 13 · data 6'),
      P('d7', 'D7', 140, 100, 'io', undefined, 'Pin 14 · data 7'),
      P('a', 'A', 150, 100, 'vcc', undefined, 'Pin 15 · backlight +'),
      P('k', 'K', 160, 100, 'gnd', undefined, 'Pin 16 · backlight −')
    ],
    props: [prop('line1', 'Line 1', { type: 'text' }), prop('line2', 'Line 2', { type: 'text' })],
    defaults: { line1: 'Hello, Elementa!', line2: '' },
    model: { type: 'display', variant: 'lcd16x2' },
    description: 'HD44780-compatible 16×2 character LCD in 4-bit mode: RS/E + D4–D7. Contrast on V0 via a 10 kΩ pot. Backlight needs a series resistor (≈ 47 Ω at 5 V).',
    ratings: ['VDD 4.5–5.5 V', 'Backlight ~100 mA (use 47 Ω)', 'Logic 5 V']
  },
  {
    id: 'lcd-i2c',
    category: 'sensors',
    family: 'module',
    name: 'LCD 16×2 with I²C backpack (PCF8574)',
    partNumber: 'LCD1602-I2C',
    w: 170,
    h: 100,
    pins: [P('gnd', 'GND', 10, 100, 'gnd', undefined, 'GND'), P('vcc', 'VCC', 20, 100, 'vcc', undefined, '5 V'), P('sda', 'SDA', 30, 100, 'io', undefined, 'I²C data (addr 0x27/0x3F)'), P('scl', 'SCL', 40, 100, 'io', undefined, 'I²C clock')],
    props: [prop('line1', 'Line 1', { type: 'text' }), prop('line2', 'Line 2', { type: 'text' })],
    defaults: { line1: 'Hello, Elementa!', line2: '' },
    model: { type: 'display', variant: 'lcd16x2-i2c' },
    description: 'Standard 16×2 LCD with a PCF8574 I²C expander: four wires instead of sixteen. Address 0x27 (or 0x3F). Contrast pot on the backpack.',
    ratings: ['VCC 5 V', 'I²C 100 kHz', 'Backlight on by default']
  },
  {
    id: 'display-7seg',
    category: 'sensors',
    family: 'module',
    name: '7-segment display (common cathode)',
    partNumber: 'LTD-5461AS',
    w: 60,
    h: 110,
    pins: [
      P('e', 'E', 10, 110, 'io', undefined, 'Segment E'),
      P('d', 'D', 20, 110, 'io', undefined, 'Segment D'),
      P('k1', 'K', 30, 110, 'gnd', undefined, 'Common cathode'),
      P('c', 'C', 40, 110, 'io', undefined, 'Segment C'),
      P('dp', 'DP', 50, 110, 'io', undefined, 'Decimal point'),
      P('b', 'B', 60, 110, 'io', undefined, 'Segment B'),
      P('a', 'A', 10, 0, 'io', undefined, 'Segment A'),
      P('f', 'F', 20, 0, 'io', undefined, 'Segment F'),
      P('k2', 'K', 30, 0, 'gnd', undefined, 'Common cathode'),
      P('g', 'G', 40, 0, 'io', undefined, 'Segment G'),
      P('k3', 'K', 50, 0, 'gnd', undefined, 'Common cathode')
    ],
    props: [prop('digit', 'Digit (0–9, A–F)', { type: 'text' })],
    defaults: { digit: '8' },
    model: { type: 'display', variant: '7seg' },
    description: 'Single-digit 7-segment LED. Common-cathode: drive a segment HIGH (through ~220 Ω) to light it, and tie the cathode to GND. Segment a–g + dp.',
    ratings: ['Forward ~2 V per segment', '20 mA per segment', 'Common cathode']
  },
  {
    id: 'buzzer',
    category: 'sensors',
    family: 'module',
    name: 'Piezo buzzer (active)',
    partNumber: 'PKM13EPYH',
    w: 40,
    h: 40,
    pins: [P('pos', '+', 10, 40, 'io', undefined, '+ (active, 3–5 V)'), P('neg', '−', 30, 40, 'gnd', undefined, '− (ground)')],
    props: [prop('freq', 'Tone', { min: 200, max: 5000, step: 10, unit: 'Hz' })],
    defaults: { freq: 2000 },
    model: { type: 'buzzer' },
    description: 'Piezo transducer that beeps at its resonant frequency when driven by DC (active). Use tone() on a PWM pin to change pitch with a passive buzzer instead.',
    ratings: ['Rated 3–5 V', 'Current ≈ 30 mA', 'Frequency 2 kHz']
  },
  {
    id: 'servo-sg90',
    category: 'sensors',
    family: 'module',
    name: 'Micro servo SG90',
    partNumber: 'SG90',
    w: 60,
    h: 50,
    pins: [P('brown', 'GND', 10, 50, 'gnd', undefined, 'Brown · GND'), P('red', 'VCC', 20, 50, 'vcc', undefined, 'Red · 4.8–6 V'), P('orange', 'SIG', 30, 50, 'pwm', undefined, 'Orange · PWM signal (50 Hz, 1–2 ms)')],
    props: [prop('angle', 'Angle', { min: 0, max: 180, step: 1, unit: '°' })],
    defaults: { angle: 90 },
    model: { type: 'servo' },
    description: 'Hobby micro servo. Angle is set by a 1–2 ms pulse at 50 Hz (1.5 ms = centre). Draws peak current when moving; power from 5 V, not the MCU pin.',
    ratings: ['Operating 4.8–6 V', 'Stall current ~650 mA', 'Torque 1.8 kg·cm']
  },
  {
    id: 'dc-motor',
    category: 'sensors',
    family: 'module',
    name: 'DC gear motor (3–6 V)',
    partNumber: 'TT-GEAR-6V',
    w: 60,
    h: 40,
    pins: [P('a', 'M+', 10, 40, 'io', undefined, 'Terminal A'), P('b', 'M−', 50, 40, 'io', undefined, 'Terminal B')],
    props: [prop('rpm', 'Rated speed', { min: 50, max: 300, step: 10, unit: 'RPM' })],
    defaults: { rpm: 150 },
    model: { type: 'motor' },
    description: 'Brushed DC gear motor. Speed ∝ voltage, torque ∝ current. Stalls draw several times the rated current: always drive through a transistor or L293D with a flyback diode.',
    ratings: ['Rated 6 V, 150 RPM', 'Stall current ~ 1 A', 'Use flyback diode']
  },
  {
    id: 'stepper-28byj',
    category: 'sensors',
    family: 'module',
    name: 'Stepper 28BYJ-48 (ULN2003 driver)',
    partNumber: '28BYJ-48',
    w: 90,
    h: 60,
    pins: [P('in1', 'IN1', 10, 60, 'io', undefined, 'Coil 1'), P('in2', 'IN2', 20, 60, 'io', undefined, 'Coil 2'), P('in3', 'IN3', 30, 60, 'io', undefined, 'Coil 3'), P('in4', 'IN4', 40, 60, 'io', undefined, 'Coil 4'), P('vcc', 'VCC', 60, 60, 'vcc', undefined, '5 V'), P('gnd', 'GND', 70, 60, 'gnd', undefined, 'GND')],
    props: [prop('steps', 'Steps (2048 = 1 rev)', { min: 0, max: 4096, step: 1 })],
    defaults: { steps: 0 },
    model: { type: 'driver', variant: 'stepper' },
    description: '5 V unipolar stepper with 1:64 gearbox (2048 half-steps per output revolution). The ULN2003 driver board sits on the same module; energise coils in sequence (half-step).',
    ratings: ['5 V, ~240 mA', '2048 steps/rev (half-step)', 'Speed max ~15 RPM']
  },
  {
    id: 'nrf24l01',
    category: 'sensors',
    family: 'module',
    name: 'NRF24L01+ radio',
    partNumber: 'NRF24L01+',
    w: 60,
    h: 70,
    pins: [P('gnd', 'GND', 10, 70, 'gnd', undefined, 'GND'), P('vcc', 'VCC', 20, 70, 'vcc', undefined, '1.9–3.6 V (NOT 5 V)'), P('ce', 'CE', 30, 70, 'io', undefined, 'Chip enable'), P('csn', 'CSN', 40, 70, 'io', undefined, 'SPI chip select'), P('sck', 'SCK', 50, 70, 'io', undefined, 'SPI clock'), P('mosi', 'MOSI', 60, 70, 'io', undefined, 'SPI MOSI'), P('miso', 'MISO', 70, 70, 'io', undefined, 'SPI MISO'), P('irq', 'IRQ', 80, 70, 'io', undefined, 'Interrupt (active low)')],
    props: [],
    defaults: {},
    model: { type: 'wireless', variant: 'nrf24' },
    description: '2.4 GHz SPI radio, 250 kbps–2 Mbps, 126 channels. Runs on 3.3 V and is NOT 5 V tolerant. Add a 10–100 µF capacitor across VCC/GND for the current peaks.',
    ratings: ['VCC 1.9–3.6 V', 'Peak TX ~ 115 mA', 'Range ~100 m (line of sight)']
  },
  {
    id: 'hc-05',
    category: 'sensors',
    family: 'module',
    name: 'Bluetooth HC-05 (SPP)',
    partNumber: 'HC-05',
    w: 60,
    h: 70,
    pins: [P('en', 'EN', 10, 70, 'nc', undefined, 'Key / enable (AT mode)'), P('vcc', 'VCC', 20, 70, 'vcc', undefined, '3.6–6 V'), P('gnd', 'GND', 30, 70, 'gnd', undefined, 'GND'), P('txd', 'TXD', 40, 70, 'io', undefined, 'UART TX (3.3 V out)'), P('rxd', 'RXD', 50, 70, 'io', undefined, 'UART RX (3.3 V in)'), P('state', 'STATE', 60, 70, 'nc', undefined, 'Connection state LED')],
    props: [],
    defaults: {},
    model: { type: 'wireless', variant: 'hc05' },
    description: 'Classic Bluetooth serial module (SPP). Pair with a phone, then send bytes over UART at 9600 baud by default. RXD expects 3.3 V: use a divider from a 5 V TX.',
    ratings: ['VCC 3.6–6 V', 'UART 9600 8N1 default', 'Range ~10 m']
  },
  {
    id: 'rfid-rc522',
    category: 'sensors',
    family: 'module',
    name: 'RFID reader RC522',
    partNumber: 'MFRC522',
    w: 60,
    h: 70,
    pins: [P('sda', 'SDA', 10, 70, 'io', undefined, 'SPI chip select'), P('sck', 'SCK', 20, 70, 'io', undefined, 'SPI clock'), P('mosi', 'MOSI', 30, 70, 'io', undefined, 'SPI MOSI'), P('miso', 'MISO', 40, 70, 'io', undefined, 'SPI MISO'), P('irq', 'IRQ', 50, 70, 'nc', undefined, 'Interrupt (optional)'), P('gnd', 'GND', 60, 70, 'gnd', undefined, 'GND'), P('rst', 'RST', 70, 70, 'io', undefined, 'Reset (active low)'), P('vcc', 'VCC', 80, 70, 'vcc', undefined, '3.3 V ONLY')],
    props: [],
    defaults: {},
    model: { type: 'wireless', variant: 'rfid' },
    description: '13.56 MHz MIFARE reader on SPI. 3.3 V supply only. Read the 4-byte UID of a card to authenticate access.',
    ratings: ['VCC 3.3 V', 'Read range ~ 3–5 cm', 'Card: MIFARE Classic 1K']
  },
  {
    id: 'gps-neo6m',
    category: 'sensors',
    family: 'module',
    name: 'GPS module NEO-6M',
    partNumber: 'NEO-6M',
    w: 70,
    h: 70,
    pins: [P('vcc', 'VCC', 10, 70, 'vcc', undefined, '3.3–5 V'), P('gnd', 'GND', 20, 70, 'gnd', undefined, 'GND'), P('rxd', 'RXD', 30, 70, 'io', undefined, 'UART RX (module input)'), P('txd', 'TXD', 40, 70, 'io', undefined, 'UART TX (NMEA output)'), P('pps', 'PPS', 50, 70, 'nc', undefined, '1 pulse/s timing')],
    props: [prop('lat', 'Latitude', { min: -90, max: 90, step: 0.0001, unit: '°' }), prop('lng', 'Longitude', { min: -180, max: 180, step: 0.0001, unit: '°' })],
    defaults: { lat: 23.8103, lng: 90.4125 },
    model: { type: 'wireless', variant: 'gps' },
    description: 'GNSS receiver with NMEA 0183 output at 9600 baud (GPGGA/GPRMC sentences). Needs a clear sky view; first fix can take ~30 s.',
    ratings: ['VCC 3–5 V', 'NMEA 9600 8N1', 'Cold start ~27 s']
  }
];

const power: PartDef[] = [
  {
    id: 'battery-9v',
    category: 'power',
    family: 'battery-9v',
    name: '9 V battery (PP3)',
    partNumber: 'PP3-6LR61',
    w: 70,
    h: 50,
    pins: [P('pos', '+', 10, 50, 'vcc', undefined, '+9 V (snap terminal)'), P('neg', '−', 60, 50, 'gnd', undefined, '− (ground)')],
    props: [prop('volts', 'Voltage', { min: 1, max: 12, step: 0.1, unit: 'V' }), prop('mah', 'Capacity', { min: 100, max: 1200, step: 10, unit: 'mAh' })],
    defaults: { volts: 9, mah: 500 },
    model: { type: 'source' },
    description: 'Alkaline 9 V block (6F22). Internal resistance rises as it drains; short-circuiting it causes heating and possible leakage.',
    ratings: ['Nominal 9 V', 'Capacity ~ 500 mAh', 'Do not short-circuit']
  },
  {
    id: 'battery-aa4',
    category: 'power',
    family: 'battery-pack',
    name: 'AA battery pack (4× AA)',
    partNumber: 'BH-4AA',
    w: 90,
    h: 60,
    pins: [P('pos', '+', 10, 60, 'vcc', undefined, '+6 V'), P('neg', '−', 80, 60, 'gnd', undefined, '− (ground)')],
    props: [prop('volts', 'Voltage', { min: 1, max: 12, step: 0.1, unit: 'V' })],
    defaults: { volts: 6 },
    model: { type: 'source' },
    description: 'Four AA cells in series (4 × 1.5 V). Good for motors and servos; use alkaline or NiMH (4 × 1.2 V = 4.8 V).',
    ratings: ['6.0 V nominal (alkaline)', 'Do not mix old/new cells']
  },
  {
    id: 'lipo-37',
    category: 'power',
    family: 'battery-pack',
    name: 'LiPo 3.7 V (1S)',
    partNumber: 'LIPO-1S-1000',
    w: 80,
    h: 50,
    pins: [P('pos', '+', 10, 50, 'vcc', undefined, '+ (red)'), P('neg', '−', 70, 50, 'gnd', undefined, '− (black)')],
    props: [prop('volts', 'Voltage', { min: 3, max: 4.2, step: 0.01, unit: 'V' }), prop('mah', 'Capacity', { min: 100, max: 5000, step: 50, unit: 'mAh' })],
    defaults: { volts: 3.7, mah: 1000 },
    model: { type: 'source' },
    description: 'Single-cell lithium polymer, 3.0 V (empty) to 4.2 V (full). Needs a protection circuit (PCM) and a charger — never reverse or short it.',
    ratings: ['Cut-off 3.0 V', 'Max 4.2 V', 'Never short-circuit']
  },
  {
    id: 'usb-5v',
    category: 'power',
    family: 'usb-power',
    name: 'USB 5 V supply',
    partNumber: 'USB-A-5V',
    w: 60,
    h: 50,
    pins: [P('vbus', 'VBUS', 10, 50, 'vcc', undefined, '+5 V (500 mA)'), P('gnd', 'GND', 50, 50, 'gnd', undefined, 'GND')],
    props: [prop('volts', 'Voltage', { min: 3.3, max: 5.5, step: 0.1, unit: 'V' }), prop('limit', 'Current limit', { min: 0.1, max: 3, step: 0.1, unit: 'A' })],
    defaults: { volts: 5, limit: 0.5 },
    model: { type: 'source' },
    description: 'USB host port: 5 V, 500 mA default (up to 3 A on fast chargers). Behaves like a stiff 5 V source with a current limit.',
    ratings: ['5 V ±5 %', '500 mA (USB 2.0)', 'Current limit trips on overload']
  },
  {
    id: 'bench-supply',
    category: 'power',
    family: 'bench-supply',
    name: 'Bench power supply (adjustable)',
    partNumber: 'PSU-30V-3A',
    w: 90,
    h: 70,
    pins: [P('pos', '+', 10, 70, 'vcc', undefined, 'V+ output'), P('neg', '−', 30, 70, 'gnd', undefined, 'V− output (ground)')],
    props: [prop('volts', 'Voltage', { min: 0, max: 30, step: 0.1, unit: 'V' }), prop('limit', 'Current limit', { min: 0.01, max: 3, step: 0.01, unit: 'A' })],
    defaults: { volts: 5, limit: 1 },
    model: { type: 'source' },
    description: 'Adjustable DC bench supply. Output stays at the set voltage until the current limit is reached, then folds back to constant current. Good for lab work.',
    ratings: ['0–30 V', '0–3 A', 'Current limit protects against short-circuits']
  },
  {
    id: 'ac-source',
    category: 'power',
    family: 'bench-supply',
    name: 'Function generator (waveform source)',
    partNumber: 'FGEN-1MHZ',
    w: 90,
    h: 70,
    pins: [P('out', 'OUT', 10, 70, 'io', undefined, 'Signal output'), P('gnd', 'GND', 30, 70, 'gnd', undefined, 'Reference ground')],
    props: [prop('freq', 'Frequency', { min: 0.1, max: 100000, step: 1, unit: 'Hz' }), prop('amp', 'Amplitude (peak)', { min: 0, max: 10, step: 0.1, unit: 'V' }), prop('offset', 'DC offset', { min: -5, max: 5, step: 0.1, unit: 'V' })],
    defaults: { freq: 1000, amp: 1, offset: 0 },
    model: { type: 'source', ac: true },
    description: 'Sine/square/triangle source with adjustable frequency, amplitude and offset. The signal appears between OUT and GND. Use the oscilloscope to watch it.',
    ratings: ['Output up to 20 Vpp into 50 Ω', 'Max 100 kHz (model)']
  },
  {
    id: 'switch-spst',
    category: 'power',
    family: 'switch',
    name: 'Toggle switch (SPST)',
    partNumber: 'SPST-MTS',
    w: 40,
    h: 30,
    pins: [P('a', 'T1', 0, 20, 'io', undefined, 'Terminal 1'), P('b', 'T2', 40, 20, 'io', undefined, 'Terminal 2')],
    props: [prop('closed', 'Closed', { type: 'boolean' })],
    defaults: { closed: false },
    model: { type: 'switch' },
    description: 'Single-pole single-throw toggle. Click the lever in the inspector or on the bench to open/close the circuit.',
    ratings: ['Contacts 3 A @ 250 VAC', 'Contact resistance < 50 mΩ']
  },
  {
    id: 'switch-spdt',
    category: 'power',
    family: 'switch',
    name: 'Slide switch (SPDT)',
    partNumber: 'SS-12D00',
    w: 50,
    h: 30,
    pins: [P('com', 'COM', 10, 20, 'io', undefined, 'Common'), P('no', 'NO', 20, 0, 'io', undefined, 'Throw A (normally open)'), P('nc', 'NC', 40, 0, 'io', undefined, 'Throw B (normally closed)')],
    props: [prop('position', 'Position', { type: 'select', options: [{ value: 'nc', label: 'NC (throw B)' }, { value: 'no', label: 'NO (throw A)' }] })],
    defaults: { position: 'nc' },
    model: { type: 'switch' },
    description: 'Single-pole double-throw slide switch. COM connects to NO or NC depending on the slider. Choose the throw in the inspector.',
    ratings: ['Contacts 0.3 A @ 125 VAC', 'Slide ±2 mm travel']
  },
  {
    id: 'pushbutton',
    category: 'power',
    family: 'pushbutton',
    name: 'Tactile push button (4-pin)',
    partNumber: 'TS-A-6x6',
    w: 40,
    h: 40,
    pins: [P('a1', '1', 0, 0, 'io', undefined, 'Pin 1 (paired with 2)'), P('a2', '2', 40, 0, 'io', undefined, 'Pin 2 (paired with 1)'), P('b1', '3', 0, 40, 'io', undefined, 'Pin 3 (paired with 4)'), P('b2', '4', 40, 40, 'io', undefined, 'Pin 4 (paired with 3)')],
    props: [prop('pressed', 'Pressed', { type: 'boolean' })],
    defaults: { pressed: false },
    model: { type: 'switch' },
    description: 'Momentary tactile switch. Pins 1-2 and 3-4 are internally bridged, so connect one from each side. Press (hold) in the inspector or on the bench.',
    ratings: ['Contacts 50 mA @ 12 VDC', 'Travel 0.25 mm']
  },
  {
    id: 'dip-switch',
    category: 'power',
    family: 'dip-switch',
    name: 'DIP switch (4-position)',
    partNumber: 'DIP-4-SPST',
    w: 60,
    h: 40,
    pins: [P('s1a', '1A', 10, 0, 'io', undefined, 'Switch 1 · A'), P('s2a', '2A', 20, 0, 'io', undefined, 'Switch 2 · A'), P('s3a', '3A', 30, 0, 'io', undefined, 'Switch 3 · A'), P('s4a', '4A', 40, 0, 'io', undefined, 'Switch 4 · A'), P('s1b', '1B', 10, 40, 'io', undefined, 'Switch 1 · B'), P('s2b', '2B', 20, 40, 'io', undefined, 'Switch 2 · B'), P('s3b', '3B', 30, 40, 'io', undefined, 'Switch 3 · B'), P('s4b', '4B', 40, 40, 'io', undefined, 'Switch 4 · B')],
    props: [prop('sw1', 'Switch 1 on', { type: 'boolean' }), prop('sw2', 'Switch 2 on', { type: 'boolean' }), prop('sw3', 'Switch 3 on', { type: 'boolean' }), prop('sw4', 'Switch 4 on', { type: 'boolean' })],
    defaults: { sw1: false, sw2: false, sw3: false, sw4: false },
    model: { type: 'switch' },
    description: 'Four independent SPST switches in one package. Each row A/B is one switch. Toggle the switches in the inspector.',
    ratings: ['25 mA @ 24 VDC per switch']
  },
  {
    id: 'jumper-wire',
    category: 'power',
    family: 'jumper',
    name: 'Jumper wire (male–male, colour)',
    partNumber: 'DUPONT-MM-20',
    w: 60,
    h: 20,
    pins: [P('a', 'A', 0, 10, 'io', undefined, 'End A'), P('b', 'B', 60, 10, 'io', undefined, 'End B')],
    props: [{ key: 'color', label: 'Colour', type: 'select', options: [{ value: 'red', label: 'Red' }, { value: 'black', label: 'Black' }, { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' }, { value: 'yellow', label: 'Yellow' }, { value: 'white', label: 'White' }, { value: 'orange', label: 'Orange' }, { value: 'purple', label: 'Purple' }] }],
    defaults: { color: 'blue' },
    model: { type: 'resistor' },
    description: 'Dupont-style jumper. Modelled as a 0.05 Ω conductor. Pick its colour in the inspector to keep your wiring readable.',
    ratings: ['Current ≤ 1 A', 'Resistance ~ 50 mΩ']
  },
  {
    id: 'gnd-symbol',
    category: 'power',
    family: 'symbol',
    name: 'Ground (GND) symbol',
    partNumber: 'SYM-GND',
    w: 30,
    h: 30,
    pins: [P('g', 'GND', 10, 0, 'gnd', undefined, '0 V reference node')],
    props: [],
    defaults: {},
    model: { type: 'gnd' },
    description: 'Reference node for 0 V. All GND symbols on the bench are electrically the same node.',
    ratings: ['0 V reference']
  },
  {
    id: 'vcc-symbol',
    category: 'power',
    family: 'symbol',
    name: 'VCC / +V symbol',
    partNumber: 'SYM-VCC',
    w: 30,
    h: 30,
    pins: [P('v', 'VCC', 10, 20, 'vcc', undefined, 'Supply node (reference: label only)')],
    props: [],
    defaults: {},
    model: { type: 'prototyping' },
    description: 'Label that names a supply net. Connecting it to a wire does not add a source; use a battery or supply.',
    ratings: ['Label only']
  }
];

const tools: PartDef[] = [
  {
    id: 'multimeter',
    category: 'tools',
    family: 'instrument',
    name: 'Digital multimeter (V / A / Ω)',
    partNumber: 'DMM-6000',
    w: 110,
    h: 150,
    pins: [P('com', 'COM', 20, 150, 'gnd', undefined, 'Black probe'), P('vma', 'VΩmA', 60, 150, 'io', undefined, 'Red probe (V/Ω/mA)')],
    props: [{ key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'V', label: 'DC Volts' }, { value: 'A', label: 'DC Amps' }, { value: 'R', label: 'Resistance' }] }],
    defaults: { mode: 'V' },
    model: { type: 'meter', variant: 'multimeter' },
    description: 'Reads the voltage between the two probes (V), the current through them (A), or resistance (Ω). Attach COM and VΩmA to any two nodes. The reading is live.',
    ratings: ['Max 600 V DC', 'Max 10 A DC', 'Input impedance 10 MΩ']
  },
  {
    id: 'oscilloscope',
    category: 'tools',
    family: 'instrument',
    name: 'Oscilloscope (2-channel)',
    partNumber: 'SCOPE-2CH',
    w: 130,
    h: 110,
    pins: [P('ch1', 'CH1', 20, 110, 'io', undefined, 'Channel 1 probe'), P('gnd', 'GND', 60, 110, 'gnd', undefined, 'Probe ground'), P('ch2', 'CH2', 100, 110, 'io', undefined, 'Channel 2 probe')],
    props: [prop('div', 'Time/div', { min: 0.0001, max: 1, step: 0.0001, unit: 's' })],
    defaults: { div: 0.005 },
    model: { type: 'meter', variant: 'scope' },
    description: 'Two-channel live waveform viewer. Each channel shows the voltage relative to its GND probe. Adjust the time base in the inspector.',
    ratings: ['Bandwidth 20 MHz (model)', 'Input 1 MΩ / 15 pF', 'Max 400 V (×10 probe)']
  },
  {
    id: 'logic-analyzer',
    category: 'tools',
    family: 'instrument',
    name: 'Logic analyzer (8-channel)',
    partNumber: 'LA-8CH-24M',
    w: 130,
    h: 110,
    pins: [P('d0', 'D0', 10, 110, 'io', undefined, 'Channel 0'), P('d1', 'D1', 20, 110, 'io', undefined, 'Channel 1'), P('d2', 'D2', 30, 110, 'io', undefined, 'Channel 2'), P('d3', 'D3', 40, 110, 'io', undefined, 'Channel 3'), P('d4', 'D4', 50, 110, 'io', undefined, 'Channel 4'), P('d5', 'D5', 60, 110, 'io', undefined, 'Channel 5'), P('d6', 'D6', 70, 110, 'io', undefined, 'Channel 6'), P('d7', 'D7', 80, 110, 'io', undefined, 'Channel 7'), P('gnd', 'GND', 100, 110, 'gnd', undefined, 'Probe ground')],
    props: [prop('threshold', 'Threshold', { min: 0.5, max: 5, step: 0.1, unit: 'V' })],
    defaults: { threshold: 1.65 },
    model: { type: 'meter', variant: 'la' },
    description: 'Eight digital channels shown as timing traces. A channel reads HIGH above the threshold. Use it to inspect I²C, SPI and UART timing.',
    ratings: ['Max 5.5 V', '24 MS/s (model)', 'Threshold adjustable']
  },
  {
    id: 'function-generator',
    category: 'tools',
    family: 'instrument',
    name: 'Function generator (probe)',
    partNumber: 'FG-100K',
    w: 110,
    h: 100,
    pins: [P('out', 'OUT', 20, 100, 'io', undefined, 'Signal output'), P('gnd', 'GND', 60, 100, 'gnd', undefined, 'Reference ground')],
    props: [prop('freq', 'Frequency', { min: 0.1, max: 100000, step: 1, unit: 'Hz' }), prop('amp', 'Amplitude (peak)', { min: 0, max: 10, step: 0.1, unit: 'V' })],
    defaults: { freq: 1000, amp: 1 },
    model: { type: 'meter', variant: 'fgen' },
    description: 'Instrument-style signal generator. Equivalent to the AC source: sine output between OUT and GND, set by frequency and amplitude.',
    ratings: ['Output 20 Vpp max', 'Max 100 kHz']
  }
];

const partList: PartDef[] = [...boards, ...prototyping, ...passives, ...semiconductors, ...ICS, ...sensors, ...power, ...tools];

// Ensure each part has defaults for every declared prop (no undefined values).
export const PARTS: PartDef[] = partList.map((p) => {
  const pins = uniquePins(p.pins);
  const defaults: Record<string, PropValue> = { ...p.defaults };
  for (const pr of p.props) {
    if (defaults[pr.key] === undefined) {
      if (pr.type === 'boolean') defaults[pr.key] = false;
      else if (pr.type === 'select') defaults[pr.key] = pr.options?.[0]?.value ?? '';
      else if (pr.type === 'text') defaults[pr.key] = '';
      else defaults[pr.key] = pr.min ?? 0;
    }
  }
  return { ...p, pins, defaults };
});

const BY_ID = new Map(PARTS.map((p) => [p.id, p]));

export function getPart(id: string): PartDef | undefined {
  return BY_ID.get(id);
}

export function partsByCategory(): Record<PartCategory, PartDef[]> {
  const out = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, [] as PartDef[]])) as Record<PartCategory, PartDef[]>;
  for (const p of PARTS) out[p.category].push(p);
  return out;
}

export const BREADBOARD_SIZE = {
  full: breadboardSize(63),
  half: breadboardSize(30)
};
