/**
 * Microcontroller example projects. Each one carries its MCU sketch (the
 * Arduino C subset the in-browser interpreter runs) plus the wiring to sensors,
 * actuators, displays and instruments.
 */

import type { ExampleProject } from './examples';
import { C, W } from './builders';

const SKETCH_BUTTON_LED = `// Push-button with the internal pull-up: the LED on D13 follows the button.
const int BUTTON = 2;
const int LED = 13;

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}
`;

const SKETCH_BREATHE = `// Breathing LED: ramp PWM on D9 up and down with analogWrite.
const int LED = 9;
int brightness = 0;
int fadeAmount = 5;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  analogWrite(LED, brightness);
  brightness = brightness + fadeAmount;
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
  }
  delay(30);
}
`;

const SKETCH_MELODY = `// Melody on a passive buzzer: tone() on D8 with short rests.
const int BUZZER = 8;

void setup() {
}

void loop() {
  tone(BUZZER, 262, 300);
  delay(300);
  noTone(BUZZER);
  delay(50);
  tone(BUZZER, 330, 300);
  delay(300);
  noTone(BUZZER);
  delay(50);
  tone(BUZZER, 392, 300);
  delay(300);
  noTone(BUZZER);
  delay(50);
  tone(BUZZER, 523, 600);
  delay(600);
  noTone(BUZZER);
  delay(300);
}
`;

const SKETCH_PIR = `// PIR motion alarm: D2 reads the sensor, D13 lights and Serial reports motion.
const int PIR = 2;
const int LED = 13;

void setup() {
  pinMode(PIR, INPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(PIR) == HIGH) {
    digitalWrite(LED, HIGH);
    Serial.println("Motion!");
  } else {
    digitalWrite(LED, LOW);
  }
  delay(200);
}
`;

const SKETCH_TOUCH = `// Touch lamp: every new touch toggles the LED on D13.
const int TOUCH = 3;
const int LED = 13;
int lampOn = 0;
int wasTouched = 0;

void setup() {
  pinMode(TOUCH, INPUT);
  pinMode(LED, OUTPUT);
}

void loop() {
  int touched = digitalRead(TOUCH);
  if (touched == HIGH && wasTouched == LOW) {
    if (lampOn == 0) {
      lampOn = 1;
    } else {
      lampOn = 0;
    }
    digitalWrite(LED, lampOn);
  }
  wasTouched = touched;
  delay(20);
}
`;

const SKETCH_SOIL = `// Soil watering: the relay module is active-low (IN LOW closes it). The pump runs while the reading is below 400.
const int RELAY = 7;
const int DRY_LIMIT = 400;

void setup() {
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, HIGH);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  Serial.println(raw);
  if (raw < DRY_LIMIT) {
    digitalWrite(RELAY, LOW);
  } else {
    digitalWrite(RELAY, HIGH);
  }
  delay(500);
}
`;

const SKETCH_GAS = `// Gas alarm: MQ-2 analog output on A0. Above the threshold the LED and buzzer go on.
const int THRESHOLD = 350;
const int LED = 13;
const int BUZZER = 8;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  Serial.println(raw);
  if (raw > THRESHOLD) {
    digitalWrite(LED, HIGH);
    tone(BUZZER, 2000, 200);
  } else {
    digitalWrite(LED, LOW);
    noTone(BUZZER);
  }
  delay(200);
}
`;

const SKETCH_DHT22 = `// DHT22 on D2: print temperature and humidity to Serial every 2 seconds.
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  Serial.print("Temp C: ");
  Serial.println(t);
  Serial.print("Humidity %: ");
  Serial.println(h);
  delay(2000);
}
`;

const SKETCH_BMP280 = `// BMP280 on I²C (SDA = A4, SCL = A5): print pressure and temperature every second.
#include <Adafruit_BMP280.h>

Adafruit_BMP280 bmp;

void setup() {
  Serial.begin(9600);
  bmp.begin();
}

void loop() {
  float pressure = bmp.readPressure() / 100.0;
  float temperature = bmp.readTemperature();
  Serial.print("Pressure hPa: ");
  Serial.println(pressure);
  Serial.print("Temp C: ");
  Serial.println(temperature);
  delay(1000);
}
`;

const SKETCH_OLED = `// SSD1306 OLED on I²C (SDA = A4, SCL = A5): show a counter that goes up each second.
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
int counter = 0;

void setup() {
  display.begin();
  display.clearDisplay();
}

void loop() {
  display.clearDisplay();
  display.println("Uno + OLED");
  display.print("Count: ");
  display.println(counter);
  display.display();
  counter++;
  delay(1000);
}
`;

const SKETCH_LCD_PARALLEL = `// 16x2 LCD in 4-bit parallel mode: RS=12, E=11, D4..D7 = 5,4,3,2.
#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
int count = 0;

void setup() {
  lcd.begin(16, 2);
  lcd.print("Hello, LCD!");
}

void loop() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Count: ");
  lcd.print(count);
  lcd.setCursor(0, 1);
  lcd.print("Every second");
  count++;
  delay(1000);
}
`;

const SKETCH_LCD_UPTIME = `// I²C LCD 16x2 on A4/A5: count the seconds since power-on.
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
int seconds = 0;

void setup() {
  lcd.init();
  lcd.backlight();
}

void loop() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Uptime (s):");
  lcd.setCursor(0, 1);
  lcd.print(seconds);
  seconds++;
  delay(1000);
}
`;

const SKETCH_SERVO_POT = `// Servo follows a pot: A0 reads the pot, the servo on D9 moves to the matching angle.
#include <Servo.h>

Servo servo;

void setup() {
  servo.attach(9);
}

void loop() {
  int raw = analogRead(A0);
  int angle = map(raw, 0, 1023, 0, 180);
  servo.write(angle);
  delay(15);
}
`;

const SKETCH_STEPPER = `// 28BYJ-48 driven one coil phase at a time on D8..D11 (half-step sequence), forward then back.
const int IN1 = 8;
const int IN2 = 9;
const int IN3 = 10;
const int IN4 = 11;

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
}

void coil(int a, int b, int c, int d) {
  digitalWrite(IN1, a);
  digitalWrite(IN2, b);
  digitalWrite(IN3, c);
  digitalWrite(IN4, d);
}

void phase(int p) {
  if (p == 0) coil(HIGH, LOW, LOW, LOW);
  if (p == 1) coil(HIGH, HIGH, LOW, LOW);
  if (p == 2) coil(LOW, HIGH, LOW, LOW);
  if (p == 3) coil(LOW, HIGH, HIGH, LOW);
  if (p == 4) coil(LOW, LOW, HIGH, LOW);
  if (p == 5) coil(LOW, LOW, HIGH, HIGH);
  if (p == 6) coil(LOW, LOW, LOW, HIGH);
  if (p == 7) coil(HIGH, LOW, LOW, HIGH);
}

void loop() {
  for (int s = 0; s < 8; s++) {
    phase(s);
    delay(3);
  }
  for (int s = 7; s >= 0; s--) {
    phase(s);
    delay(3);
  }
}
`;

const SKETCH_LA = `// Two signals for the logic analyser: D13 toggles every 100 ms, D12 every 200 ms.
void setup() {
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  digitalWrite(12, HIGH);
  delay(100);
  digitalWrite(13, LOW);
  delay(100);
  digitalWrite(13, HIGH);
  digitalWrite(12, LOW);
  delay(100);
  digitalWrite(13, LOW);
  delay(100);
}
`;

const SKETCH_SCOPE_PWM = `// PWM on D9 at about 50 % duty: watch the square wave on the scope.
void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  analogWrite(9, 128);
  delay(100);
}
`;

const SKETCH_LEDC = `// ESP32 LEDC hardware PWM: fade an LED on GPIO25 up and down.
const int LED_PIN = 25;
const int CH = 0;

void setup() {
  ledcSetup(CH, 5000, 8);
  ledcAttachPin(LED_PIN, CH);
}

void loop() {
  for (int d = 0; d <= 255; d += 15) {
    ledcWrite(CH, d);
    delay(30);
  }
  for (int d = 255; d >= 0; d -= 15) {
    ledcWrite(CH, d);
    delay(30);
  }
}
`;

const buttonLed: ExampleProject = {
  id: 'uno-button-led',
  name: 'Button controls LED (pull-up)',
  title: { en: 'Button controls an LED (INPUT_PULLUP)', bn: 'বাটন দিয়ে LED (INPUT_PULLUP)' },
  summary: {
    en: 'The Uno’s internal pull-up keeps D2 high. Pressing the button pulls it low and lights the LED on D13.',
    bn: 'Uno-র অভ্যন্তরীণ পুল-আপ D2-কে উঁচু রাখে। বাটন চাপলে তা নিচু হয় এবং D13-এর LED জ্বলে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Arduino Uno with the sketch, a push-button, a 220 Ω resistor and a red LED.', bn: 'স্কেচসহ Arduino Uno, একটি পুশবাটন, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'Button: a1 → D2, b1 → GND. LED: D13 → 220 Ω → anode, cathode → GND.', bn: 'বাটন: a1 → D2, b1 → GND। LED: D13 → ২২০ Ω → অ্যানোড, ক্যাথোড → GND।' },
    { en: 'Run and press the button in the inspector. The LED follows it.', bn: 'Run করে ইন্সপেক্টরে বাটন চাপুন। LED সেটি অনুসরণ করবে।' }
  ],
  explanation: {
    en: 'INPUT_PULLUP connects D2 to a weak internal pull-up, so the pin reads HIGH when the button is open. Pressing the button connects D2 to GND and it reads LOW. The sketch checks digitalRead every loop and copies the result to the LED, so no wire needs a separate resistor for the button.',
    bn: 'INPUT_PULLUP D2-কে দুর্বল অভ্যন্তরীণ পুল-আপের সাথে যুক্ত করে, তাই বাটন খোলা থাকলে পিন HIGH পড়ে। বাটন চাপলে D2 GND-তে যায় এবং LOW পড়ে। প্রতি লুপে digitalRead পড়ে LED-তে কপি করা হয়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_BUTTON_LED),
    C('pb', 'pushbutton', 320, 40, { pressed: false }),
    C('r', 'resistor', 320, 160, { ohms: 220 }),
    C('led', 'led-red', 440, 160, { color: 'red' })
  ],
  wires: [
    W('w1', 'uno.D2', 'pb.a1', 'yellow'),
    W('w2', 'pb.b1', 'uno.GND_B1', 'black'),
    W('w3', 'uno.D13', 'r.a', 'yellow'),
    W('w4', 'r.b', 'led.anode', 'yellow'),
    W('w5', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const breathingLed: ExampleProject = {
  id: 'uno-breathing-led',
  name: 'Breathing LED (PWM fade)',
  title: { en: 'Breathing LED with PWM', bn: 'PWM দিয়ে শ্বাস-প্রশ্বাসের মতো LED' },
  summary: {
    en: 'analogWrite on pin 9 ramps the LED brightness up and down, forming a breathing effect.',
    bn: 'পিন ৯-এ analogWrite LED-এর উজ্জ্বলতা ওঠানামা করায়, যা শ্বাস-প্রশ্বাসের মতো দেখায়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch, a 220 Ω resistor and a red LED.', bn: 'স্কেচসহ Uno, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'D9 → 220 Ω → LED anode, LED cathode → GND.', bn: 'D9 → ২২০ Ω → LED অ্যানোড, LED ক্যাথোড → GND।' },
    { en: 'Run and watch the glow. Change fadeAmount in the sketch to speed it up.', bn: 'Run করে উজ্জ্বলতা দেখুন। স্কেচে fadeAmount বদলে গতি বাড়ান।' }
  ],
  explanation: {
    en: 'analogWrite sets a PWM duty cycle from 0 to 255. The pin switches fully on and off many times a second, and the LED’s average current, and so its brightness, follows the duty. Stepping the value up and down by 5 each 30 ms gives a smooth fade.',
    bn: 'analogWrite ০ থেকে ২৫৫ পর্যন্ত PWM ডিউটি সাইকেল ঠিক করে। পিন সেকেন্ডে অনেকবার পূর্ণ চালু ও বন্ধ হয়, তাই LED-এর গড় কারেন্ট, অর্থাৎ উজ্জ্বলতা, ডিউটির সাথে বদলায়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_BREATHE),
    C('r', 'resistor', 320, 120, { ohms: 220 }),
    C('led', 'led-red', 440, 120, { color: 'red' })
  ],
  wires: [
    W('w1', 'uno.D9', 'r.a', 'yellow'),
    W('w2', 'r.b', 'led.anode', 'yellow'),
    W('w3', 'led.cathode', 'uno.GND_B1', 'black')
  ]
};

const buzzerMelody: ExampleProject = {
  id: 'uno-buzzer-melody',
  name: 'Buzzer melody with tone()',
  title: { en: 'Buzzer melody with tone()', bn: 'tone() দিয়ে বাজারে সুর' },
  summary: {
    en: 'tone() on D8 plays a short melody on a passive buzzer, with rests between the notes.',
    bn: 'D8-এ tone() একটি প্যাসিভ বাজারে ছোট সুর বাজায়, নোটের মাঝে বিরতি থাকে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch and a buzzer.', bn: 'স্কেচসহ Uno ও একটি বাজার বসান।' },
    { en: 'D8 → buzzer (+), buzzer (−) → GND.', bn: 'D8 → বাজার (+), বাজার (−) → GND।' },
    { en: 'Run. Each note plays, then noTone() silences the buzzer for the rest.', bn: 'Run করুন। প্রতিটি নোট বাজবে, তারপর noTone() বাজারকে বিরতির জন্য নীরব করবে।' }
  ],
  explanation: {
    en: 'A passive buzzer has no oscillator inside, so the MCU must provide the frequency. tone(pin, Hz, ms) square-waves the pin at that frequency. Each note is followed by noTone(), which silences the pin, so the rests are quiet. Call noTone() explicitly rather than relying on the duration argument.',
    bn: 'প্যাসিভ বাজারে ভেতরে অসিলেটর নেই, তাই কম্পাঙ্ক MCU-কে দিতে হয়। tone(পিন, Hz, ms) ঐ কম্পাঙ্কে বর্গাকার তরঙ্গ দেয়। প্রতিটি নোটের পর noTone() পিনকে নীরব করে, তাই বিরতি শান্ত থাকে। সময়-আর্গুমেন্টের উপর না নির্ভর করে noTone() স্পষ্টভাবে ডাকুন।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_MELODY),
    C('bz', 'buzzer', 320, 80, { freq: 523 })
  ],
  wires: [
    W('w1', 'uno.D8', 'bz.pos', 'yellow'),
    W('w2', 'bz.neg', 'uno.GND_B1', 'black')
  ]
};

const pirAlarm: ExampleProject = {
  id: 'uno-pir-alarm',
  name: 'PIR motion alarm',
  title: { en: 'PIR motion alarm with Serial', bn: 'PIR গতি-অ্যালার্ম ও Serial' },
  summary: {
    en: 'A PIR sensor on D2 lights the LED and prints “Motion!” on Serial whenever it sees movement.',
    bn: 'D2-তে PIR সেন্সর নড়াচড়া পেলে LED জ্বালায় ও Serial-এ “Motion!” লেখে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch, a PIR sensor, a 220 Ω resistor and a red LED.', bn: 'স্কেচসহ Uno, একটি PIR সেন্সর, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'PIR: VCC → 5 V, GND → GND, OUT → D2. LED: D13 → 220 Ω → anode, cathode → GND.', bn: 'PIR: VCC → 5 V, GND → GND, OUT → D2। LED: D13 → ২২০ Ω → অ্যানোড, ক্যাথোড → GND।' },
    { en: 'Run, then set motion to true in the inspector and open the serial monitor.', bn: 'Run করুন, ইন্সপেক্টরে motion true করুন এবং serial monitor খুলুন।' }
  ],
  explanation: {
    en: 'The PIR module drives OUT high when it detects infrared change, usually a warm body moving. The loop reads D2 and mirrors it to the LED, and it prints a message when the state is high. Real modules hold OUT high for a few seconds after motion, so the LED stays on briefly.',
    bn: 'PIR মডিউল ইনফ্রারেড পরিবর্তন (সাধারণত চলমান উষ্ণ দেহ) পেলে OUT উঁচু করে। লুপ D2 পড়ে LED-এ দেখায় এবং উঁচু হলে Serial-এ বার্তা দেয়। বাস্তব মডিউল নড়ার পর কয়েক সেকেন্ড OUT উঁচু রাখে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_PIR),
    C('pir', 'pir-hc501', 240, 240, { motion: false }),
    C('r', 'resistor', 380, 80, { ohms: 220 }),
    C('led', 'led-red', 500, 80, { color: 'red' })
  ],
  wires: [
    W('w1', 'pir.vcc', 'uno.5V', 'red'),
    W('w2', 'pir.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'pir.out', 'uno.D2', 'yellow'),
    W('w4', 'uno.D13', 'r.a', 'yellow'),
    W('w5', 'r.b', 'led.anode', 'yellow'),
    W('w6', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const touchLamp: ExampleProject = {
  id: 'uno-touch-lamp',
  name: 'Touch lamp (toggle)',
  title: { en: 'Touch lamp with a capacitive sensor', bn: 'ক্যাপাসিটিভ সেন্সরে টাচ ল্যাম্প' },
  summary: {
    en: 'A TTP223 touch sensor toggles the LED on each new touch, so one touch turns it on and the next turns it off.',
    bn: 'TTP223 টাচ সেন্সর প্রতিবার নতুন স্পর্শে LED-এর অবস্থা উল্টায়: এক স্পর্শে জ্বলবে, পরেরটিতে নিভবে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch, a TTP223 touch sensor, a 220 Ω resistor and a red LED.', bn: 'স্কেচসহ Uno, একটি TTP223 টাচ সেন্সর, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'TTP223: VCC → 5 V, GND → GND, OUT → D3. LED: D13 → 220 Ω → anode, cathode → GND.', bn: 'TTP223: VCC → 5 V, GND → GND, OUT → D3। LED: D13 → ২২০ Ω → অ্যানোড, ক্যাথোড → GND।' },
    { en: 'Run and set touched to true, then to false, then to true again in the inspector. The LED toggles each time.', bn: 'Run করে ইন্সপেক্টরে touched true, তারপর false, তারপর আবার true করুন। প্রতিবার LED বদলাবে।' }
  ],
  explanation: {
    en: 'The sketch remembers the last touch state. It acts only on a rising edge, from not-touched to touched, so a finger held down toggles the lamp once and not on every loop. This edge detection is the same idea as a debounced button.',
    bn: 'স্কেচ আগের স্পর্শের অবস্থা মনে রাখে। শুধু “না-স্পর্শ থেকে স্পর্শে” পরিবর্তনে কাজ করে, তাই আঙুল ধরে থাকলে একবারই উল্টায়। এটি debounce-করা বাটনের মতো ধারণা।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_TOUCH),
    C('ttp', 'touch-ttp223', 240, 240, { touched: false }),
    C('r', 'resistor', 380, 80, { ohms: 220 }),
    C('led', 'led-red', 500, 80, { color: 'red' })
  ],
  wires: [
    W('w1', 'ttp.vcc', 'uno.5V', 'red'),
    W('w2', 'ttp.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'ttp.out', 'uno.D3', 'yellow'),
    W('w4', 'uno.D13', 'r.a', 'yellow'),
    W('w5', 'r.b', 'led.anode', 'yellow'),
    W('w6', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const soilPump: ExampleProject = {
  id: 'uno-soil-pump',
  name: 'Soil watering with relay pump',
  title: { en: 'Automatic watering with a relay pump', bn: 'রিলে পাম্প দিয়ে স্বয়ংক্রিয় পানি দেওয়া' },
  summary: {
    en: 'A soil sensor on A0 reads dry soil and switches a relay on D7. The relay runs the pump, shown here as a lamp.',
    bn: 'A0-এর মাটি সেন্সর শুষ্ক মাটি পড়লে D7-এর রিলে চালু হয়। রিলে পাম্প চালায়, এখানে তা একটি বাতি দিয়ে দেখানো হয়েছে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch, a soil-moisture sensor (moisture 20 %), a relay module, a 220 Ω resistor and a green LED as the pump.', bn: 'স্কেচসহ Uno, মাটি সেন্সর (moisture ২০%), একটি রিলে মডিউল, ২২০ Ω রোধক ও পাম্প হিসেবে সবুজ LED বসান।' },
    { en: 'Soil: VCC → 5 V, GND → GND, AO → A0. Relay: VCC → 5 V, GND → GND, IN → D7, COM → 5 V, NO → 220 Ω → LED → GND.', bn: 'মাটি: VCC → 5 V, GND → GND, AO → A0। রিলে: VCC → 5 V, GND → GND, IN → D7, COM → 5 V, NO → ২২০ Ω → LED → GND।' },
    { en: 'Run. The soil reads dry at 20 %, so the relay closes and the pump LED lights. Raise moisture to 80 % in the inspector and the pump stops.', bn: 'Run করুন। moisture ২০% হওয়ায় মাটি শুষ্ক, তাই রিলে বন্ধ হয়ে পাম্প LED জ্বলে। ইন্সপেক্টরে moisture ৮০% করলে পাম্প থামবে।' }
  ],
  explanation: {
    en: 'The soil module is a voltage divider whose output depends on moisture. In this model the reading rises with moisture, so the sketch runs the pump while the reading is below 400 counts, that is, while the soil is dry. The relay module is active-low: pulling IN to LOW closes the contacts, so the sketch writes HIGH at boot to keep the pump off. The relay isolates the pump’s higher-power circuit from the MCU pin. Real modules differ in polarity, so check the datasheet before you set the threshold.',
    bn: 'মাটি মডিউল একটি ভোল্টেজ ডিভাইডার, যার আউটপুট আর্দ্রতার উপর নির্ভর করে। এই মডেলে মান আর্দ্রতার সাথে বাড়ে, তাই মান ৪০০-এর নিচে (শুষ্ক) হলে পাম্প চলে। রিলে বেশি ক্ষমতার সার্কিটকে MCU পিন থেকে আলাদা রাখে। রিলে মডিউল active-low: IN LOW হলে সংযোগ বন্ধ হয়, তাই বুটের সময় স্কেচ HIGH লেখে যাতে পাম্প বন্ধ থাকে। বাস্তব মডিউলের দিক আলাদা হতে পারে, তাই থ্রেশহোল্ড ঠিক করার আগে ডেটশিট দেখুন।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_SOIL),
    C('soil', 'soil-moisture', 240, 40, { moisture: 20 }),
    C('relay', 'relay-5v', 240, 200, {}),
    C('r', 'resistor', 440, 200, { ohms: 220 }),
    C('pump', 'led-green', 540, 200, { color: 'green', vf: 2.2 })
  ],
  wires: [
    W('w1', 'soil.vcc', 'uno.5V', 'red'),
    W('w2', 'soil.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'soil.ao', 'uno.A0', 'green'),
    W('w4', 'relay.vcc', 'uno.5V', 'red'),
    W('w5', 'relay.gnd', 'uno.GND_B1', 'black'),
    W('w6', 'relay.in', 'uno.D7', 'yellow'),
    W('w7', 'relay.com', 'uno.5V', 'red'),
    W('w8', 'relay.no', 'r.a', 'yellow'),
    W('w9', 'r.b', 'pump.anode', 'yellow'),
    W('w10', 'pump.cathode', 'uno.GND_B2', 'black')
  ]
};

const gasAlarm: ExampleProject = {
  id: 'uno-gas-alarm',
  name: 'MQ-2 gas alarm',
  title: { en: 'Gas alarm with MQ-2 and buzzer', bn: 'MQ-2 দিয়ে গ্যাস অ্যালার্ম ও বাজার' },
  summary: {
    en: 'An MQ-2 gas sensor on A0 sets off the LED and buzzer when the reading crosses 350 counts.',
    bn: 'A0-এর MQ-2 গ্যাস সেন্সরের মান ৩৫০ ছাড়ালে LED ও বাজার চালু হয়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch, an MQ-2 module (800 ppm), a red LED with a 220 Ω resistor and a buzzer.', bn: 'স্কেচসহ Uno, MQ-2 মডিউল (৮০০ ppm), ২২০ Ω রোধকসহ লাল LED ও একটি বাজার বসান।' },
    { en: 'MQ-2: VCC → 5 V, GND → GND, AO → A0. LED: D13 → 220 Ω → anode, cathode → GND. Buzzer: D8 → (+), (−) → GND.', bn: 'MQ-2: VCC → 5 V, GND → GND, AO → A0। LED: D13 → ২২০ Ω → অ্যানোড, ক্যাথোড → GND। বাজার: D8 → (+), (−) → GND।' },
    { en: 'Run and open the serial monitor. Change ppm in the inspector to see the alarm trip.', bn: 'Run করে serial monitor খুলুন। ইন্সপেক্টরে ppm বদলে অ্যালার্ম চালু হতে দেখুন।' }
  ],
  explanation: {
    en: 'The MQ-2 changes its resistance with gas concentration, and the module turns that into an analog voltage. In this model higher ppm gives a higher reading. The sketch prints every reading, which is useful for choosing the threshold, and sounds the buzzer with tone() while the reading stays above 350.',
    bn: 'MQ-2 গ্যাসের ঘনত্বে তার রোধ বদলায়, মডিউল তা অ্যানালগ ভোল্টেজে দেয়। এই মডেলে ppm বাড়লে মান বাড়ে। স্কেচ প্রতিটি মান Serial-এ দেয় (থ্রেশহোল্ড ঠিক করতে সাহায্য করে) এবং মান ৩৫০-এর উপরে থাকলে tone() দিয়ে বাজায়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_GAS),
    C('mq', 'mq2', 240, 40, { ppm: 800 }),
    C('r', 'resistor', 240, 220, { ohms: 220 }),
    C('led', 'led-red', 360, 220, { color: 'red' }),
    C('bz', 'buzzer', 480, 120, { freq: 2000 })
  ],
  wires: [
    W('w1', 'mq.vcc', 'uno.5V', 'red'),
    W('w2', 'mq.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'mq.ao', 'uno.A0', 'green'),
    W('w4', 'uno.D13', 'r.a', 'yellow'),
    W('w5', 'r.b', 'led.anode', 'yellow'),
    W('w6', 'led.cathode', 'uno.GND_B2', 'black'),
    W('w7', 'uno.D8', 'bz.pos', 'yellow'),
    W('w8', 'bz.neg', 'uno.GND_B1', 'black')
  ]
};

const dht22Serial: ExampleProject = {
  id: 'uno-dht22-serial',
  name: 'DHT22 readings to Serial',
  title: { en: 'DHT22 temperature and humidity over Serial', bn: 'DHT22 তাপমাত্রা ও আর্দ্রতা Serial-এ' },
  summary: {
    en: 'A DHT22 on D2 prints temperature and humidity to the serial monitor every two seconds.',
    bn: 'D2-তে DHT22 প্রতি দুই সেকেন্ডে তাপমাত্রা ও আর্দ্রতা serial monitor-এ লেখে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch and a DHT22 module.', bn: 'স্কেচসহ Uno ও একটি DHT22 মডিউল বসান।' },
    { en: 'DHT22: VCC → 5 V, DATA → D2, GND → GND.', bn: 'DHT22: VCC → 5 V, DATA → D2, GND → GND।' },
    { en: 'Run and open the serial monitor. Change celsius and humidity in the inspector to see the new values.', bn: 'Run করে serial monitor খুলুন। ইন্সপেক্টরে celsius ও humidity বদলে নতুন মান দেখুন।' }
  ],
  explanation: {
    en: 'The DHT22 sends temperature and humidity on a single data wire using its own timing protocol. The DHT library hides that timing, so the sketch only calls readTemperature() and readHumidity(). Each call returns NaN if the sensor is not powered, which is why the sketch should check for NaN in a real project.',
    bn: 'DHT22 একটি ডেটা তারে নিজস্ব সময়-নিয়মে তাপমাত্রা ও আর্দ্রতা পাঠায়। DHT লাইব্রেরি সেই সময়-হিসাব লুকায়, তাই স্কেচ শুধু readTemperature() ও readHumidity() ডাকে। সেন্সর চালু না থাকলে NaN আসে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_DHT22),
    C('dht', 'dht22', 280, 60, { celsius: 22.5, humidity: 48 })
  ],
  wires: [
    W('w1', 'dht.vcc', 'uno.5V', 'red'),
    W('w2', 'dht.data', 'uno.D2', 'yellow'),
    W('w3', 'dht.gnd', 'uno.GND_B1', 'black')
  ]
};

const bmp280Serial: ExampleProject = {
  id: 'uno-bmp280-serial',
  name: 'BMP280 pressure over I²C',
  title: { en: 'BMP280 pressure and temperature (I²C)', bn: 'BMP280 চাপ ও তাপমাত্রা (I²C)' },
  summary: {
    en: 'A BMP280 on the Uno’s A4/A5 I²C bus prints air pressure in hPa and the temperature once a second.',
    bn: 'Uno-র A4/A5 I²C বাসে BMP280 প্রতি সেকেন্ডে বায়ুচাপ (hPa) ও তাপমাত্রা Serial-এ লেখে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch and a BMP280 module.', bn: 'স্কেচসহ Uno ও একটি BMP280 মডিউল বসান।' },
    { en: 'BMP280: VCC → 3V3, GND → GND, SDA → A4, SCL → A5. Tie CSB to 3V3 to select I²C mode.', bn: 'BMP280: VCC → 3V3, GND → GND, SDA → A4, SCL → A5। I²C মোড বেছে নিতে CSB → 3V3।' },
    { en: 'Run and check the serial lines. Change hpa in the inspector to watch the pressure value change.', bn: 'Run করে serial লাইন দেখুন। ইন্সপেক্টরে hpa বদলালে চাপের মান বদলাবে।' }
  ],
  explanation: {
    en: 'I²C uses two wires: SDA carries data and SCL carries the clock, and each device has its own address. The BMP280 reports pressure in Pa, so the sketch divides by 100 to get hPa. Pressure falls with altitude, which is why the same sensor can estimate height.',
    bn: 'I²C-তে দুটি তার: SDA ডেটা ও SCL ঘড়ি বহন করে, প্রতিটি ডিভাইসের আলাদা ঠিকানা থাকে। BMP280 চাপ পাসকেলে (Pa) দেয়, তাই স্কেচ ১০০ দিয়ে ভাগ করে hPa বানায়। উচ্চতা বাড়লে চাপ কমে, তাই এই সেন্সর দিয়ে উচ্চতা আন্দাজ করা যায়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_BMP280),
    C('bmp', 'bmp280', 280, 60, { hpa: 1013.25, celsius: 25 })
  ],
  wires: [
    W('w1', 'bmp.vcc', 'uno.3V3', 'red'),
    W('w2', 'bmp.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'bmp.sda', 'uno.A4', 'green'),
    W('w4', 'bmp.scl', 'uno.A5', 'yellow'),
    W('w5', 'bmp.csb', 'uno.3V3', 'red')
  ]
};

const oledCounter: ExampleProject = {
  id: 'uno-oled-counter',
  name: 'OLED counter on the Uno',
  title: { en: 'SSD1306 OLED counter on the Uno', bn: 'Uno-তে SSD1306 OLED কাউন্টার' },
  summary: {
    en: 'An SSD1306 OLED on A4/A5 shows a counter that goes up each second.',
    bn: 'A4/A5-এর SSD1306 OLED প্রতি সেকেন্ডে বাড়তে থাকা কাউন্টার দেখায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch and an SSD1306 OLED module.', bn: 'স্কেচসহ Uno ও একটি SSD1306 OLED মডিউল বসান।' },
    { en: 'OLED: GND → GND, VCC → 5 V, SCL → A5, SDA → A4.', bn: 'OLED: GND → GND, VCC → 5 V, SCL → A5, SDA → A4।' },
    { en: 'Run and watch the display in the inspector. The counter updates every second.', bn: 'Run করে ইন্সপেক্টরে ডিসপ্লে দেখুন। কাউন্টার প্রতি সেকেন্ডে বদলাবে।' }
  ],
  explanation: {
    en: 'The sketch builds text in the display buffer (println, print), then calls display() to push the buffer to the panel. clearDisplay() blanks the buffer before each frame. The OLED shares the I²C bus with any other I²C device, so the two wires are the only connection needed.',
    bn: 'স্কেচ ডিসপ্লে বাফারে লেখা তৈরি করে (print, println), তারপর display() দিয়ে প্যানেলে পাঠায়। প্রতিটি ফ্রেমের আগে clearDisplay() বাফার খালি করে। OLED অন্য I²C ডিভাইসের সাথে একই বাস ভাগ করে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_OLED),
    C('oled', 'oled-ssd1306', 300, 60, { text: '' })
  ],
  wires: [
    W('w1', 'oled.gnd', 'uno.GND_B1', 'black'),
    W('w2', 'oled.vcc', 'uno.5V', 'red'),
    W('w3', 'oled.scl', 'uno.A5', 'yellow'),
    W('w4', 'oled.sda', 'uno.A4', 'green')
  ]
};

const lcdParallel: ExampleProject = {
  id: 'uno-lcd-parallel',
  name: 'Parallel 16x2 LCD counter',
  title: { en: 'Parallel 16x2 LCD counter', bn: 'সমান্তরাল 16x2 LCD কাউন্টার' },
  summary: {
    en: 'A 16x2 LCD in 4-bit parallel mode shows a counter. It uses six data and control pins from the Uno.',
    bn: '৪-বিট সমান্তরাল মোডে 16x2 LCD একটি কাউন্টার দেখায়। Uno-র ছয়টি ডেটা ও কন্ট্রোল পিন লাগে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch and a 16x2 parallel LCD.', bn: 'স্কেচসহ Uno ও একটি 16x2 সমান্তরাল LCD বসান।' },
    { en: 'LCD: VSS → GND, VDD → 5 V, V0 → GND, RS → D12, RW → GND, E → D11, D4 → D5, D5 → D4, D6 → D3, D7 → D2, A → 5 V, K → GND.', bn: 'LCD: VSS → GND, VDD → 5 V, V0 → GND, RS → D12, RW → GND, E → D11, D4 → D5, D5 → D4, D6 → D3, D7 → D2, A → 5 V, K → GND।' },
    { en: 'Run and watch the counter increase in the inspector.', bn: 'Run করে ইন্সপেক্টরে কাউন্টার বাড়তে দেখুন।' }
  ],
  explanation: {
    en: 'The HD44780 controller takes commands over RS and E, and sends 4 bits at a time on D4 to D7. LiquidCrystal(12, 11, 5, 4, 3, 2) lists RS, E and the four data pins in that order. Setting V0 to GND gives full contrast, which is fine for a simulation; a real module usually needs a small contrast voltage.',
    bn: 'HD44780 কন্ট্রোলার RS ও E দিয়ে কমান্ড নেয় এবং D4–D7-এ একবারে ৪ বিট পাঠায়। LiquidCrystal(12, 11, 5, 4, 3, 2) RS, E ও চার ডেটা পিন এই ক্রমে নেয়। V0-কে GND-তে রাখলে সর্বোচ্চ কনট্রাস্ট মেলে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_LCD_PARALLEL),
    C('lcd', 'lcd-16x2', 300, 40, { line1: '', line2: '' })
  ],
  wires: [
    W('w1', 'lcd.vss', 'uno.GND_B1', 'black'),
    W('w2', 'lcd.vdd', 'uno.5V', 'red'),
    W('w3', 'lcd.v0', 'uno.GND_B1', 'black'),
    W('w4', 'lcd.rs', 'uno.D12', 'yellow'),
    W('w5', 'lcd.rw', 'uno.GND_B1', 'black'),
    W('w6', 'lcd.e', 'uno.D11', 'green'),
    W('w7', 'lcd.d4', 'uno.D5', 'yellow'),
    W('w8', 'lcd.d5', 'uno.D4', 'yellow'),
    W('w9', 'lcd.d6', 'uno.D3', 'yellow'),
    W('w10', 'lcd.d7', 'uno.D2', 'yellow'),
    W('w11', 'lcd.a', 'uno.5V', 'red'),
    W('w12', 'lcd.k', 'uno.GND_B2', 'black')
  ]
};

const lcdUptime: ExampleProject = {
  id: 'uno-lcd-i2c-uptime',
  name: 'I²C LCD uptime counter',
  title: { en: 'I²C LCD seconds counter', bn: 'I²C LCD সেকেন্ড কাউন্টার' },
  summary: {
    en: 'An I²C LCD on A4/A5 shows how many seconds the Uno has been running.',
    bn: 'A4/A5-এর I²C LCD দেখায় Uno কত সেকেন্ড ধরে চলছে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch and an I²C LCD 16x2.', bn: 'স্কেচসহ Uno ও একটি I²C LCD 16x2 বসান।' },
    { en: 'LCD: GND → GND, VCC → 5 V, SDA → A4, SCL → A5.', bn: 'LCD: GND → GND, VCC → 5 V, SDA → A4, SCL → A5।' },
    { en: 'Run and watch the second count in the inspector.', bn: 'Run করে ইন্সপেক্টরে সেকেন্ডের গণনা দেখুন।' }
  ],
  explanation: {
    en: 'The I²C backpack needs only two signal wires, so this display uses far fewer pins than the parallel version. The LiquidCrystal_I2C object is created with the backpack address (0x27) and the size, then init() and backlight() start it. Each loop clears the screen, writes the counter and waits a second.',
    bn: 'I²C ব্যাকপ্যাকে মাত্র দুটি সিগন্যাল তার লাগে, তাই এটি সমান্তরাল সংস্করণের চেয়ে অনেক কম পিন নেয়। LiquidCrystal_I2C ঠিকানা (0x27) ও আকার নিয়ে তৈরি হয়; init() ও backlight() চালু করে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_LCD_UPTIME),
    C('lcd', 'lcd-i2c', 300, 60, { line1: '', line2: '' })
  ],
  wires: [
    W('w1', 'lcd.gnd', 'uno.GND_B1', 'black'),
    W('w2', 'lcd.vcc', 'uno.5V', 'red'),
    W('w3', 'lcd.sda', 'uno.A4', 'green'),
    W('w4', 'lcd.scl', 'uno.A5', 'yellow')
  ]
};

const servoPot: ExampleProject = {
  id: 'uno-servo-pot',
  name: 'Servo follows a potentiometer',
  title: { en: 'Servo follows a potentiometer', bn: 'পট ঘুরালে সার্ভো ঘোরে' },
  summary: {
    en: 'Turn the pot and the servo arm follows. analogRead maps the pot reading to an angle from 0 to 180 degrees.',
    bn: 'পট ঘোরালে সার্ভোর হাত ঘোরে। analogRead পটের মানকে ০–১৮০ ডিগ্রির কোণে রূপান্তর করে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch, a 10 kΩ pot and an SG90 servo.', bn: 'স্কেচসহ Uno, একটি ১০ kΩ পট ও একটি SG90 সার্ভো বসান।' },
    { en: 'Pot: CW → 5 V, CCW → GND, wiper → A0. Servo: brown → GND, red → 5 V, orange → D9.', bn: 'পট: CW → 5 V, CCW → GND, উইপার → A0। সার্ভো: বাদামি → GND, লাল → 5 V, কমলা → D9।' },
    { en: 'Run. Set the pot to 75 % in the inspector and the servo moves to about 45°.', bn: 'Run করুন। ইন্সপেক্টরে পট ৭৫%-এ রাখলে সার্ভো প্রায় ৪৫°-তে যাবে।' }
  ],
  explanation: {
    en: 'The pot gives 0–5 V, analogRead converts it to 0–1023, and map() rescales that to 0–180 degrees. The servo reads its angle from the orange signal pin as a pulse width, and the Servo library produces that pulse for you. At 75 % the wiper sits at 1.25 V, which reads about 256 counts and gives 45°.',
    bn: 'পট ০–৫ V দেয়, analogRead তা ০–১০২৩ করে, map() তা ০–১৮০ ডিগ্রিতে আনে। সার্ভো কমলা সিগন্যাল পিনের পালস-প্রস্থ থেকে কোণ পড়ে; Servo লাইব্রেরি সেই পালস বানায়। ৭৫%-এ উইপার ১.২৫ V, যা প্রায় ২৫৬ কাউন্ট ও ৪৫°।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_SERVO_POT),
    C('pot', 'potentiometer', 260, 40, { ohms: 10000, position: 75 }),
    C('sv', 'servo-sg90', 260, 200, { angle: 90 })
  ],
  wires: [
    W('w1', 'pot.cw', 'uno.5V', 'red'),
    W('w2', 'pot.ccw', 'uno.GND_B1', 'black'),
    W('w3', 'pot.wiper', 'uno.A0', 'green'),
    W('w4', 'sv.brown', 'uno.GND_B2', 'black'),
    W('w5', 'sv.red', 'uno.5V', 'red'),
    W('w6', 'sv.orange', 'uno.D9', 'yellow')
  ]
};

const stepperSweep: ExampleProject = {
  id: 'uno-stepper-28byj',
  name: 'Stepper motor (28BYJ-48) phase drive',
  title: { en: 'Stepper motor (28BYJ-48) phase drive', bn: 'স্টেপার মোটর (28BYJ-48) ফেজ ড্রাইভ' },
  summary: {
    en: 'The sketch energises the four coils of a 28BYJ-48 on D8–D11 in half-step order, forward and then back.',
    bn: 'স্কেচ D8–D11-এ যুক্ত 28BYJ-48-এর চার কয়েল ধাপে ধাপে চালায়: আগে সামনে, তারপর পিছনে।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place an Uno with the sketch and a 28BYJ-48 stepper module.', bn: 'স্কেচসহ Uno ও একটি 28BYJ-48 স্টেপার মডিউল বসান।' },
    { en: 'Coils: IN1 → D8, IN2 → D10, IN3 → D9, IN4 → D11. Power: VCC → 5 V, GND → GND.', bn: 'কয়েল: IN1 → D8, IN2 → D10, IN3 → D9, IN4 → D11। পাওয়ার: VCC → 5 V, GND → GND।' },
    { en: 'Run. Select the stepper and watch its coil currents: the active coils change with every phase.', bn: 'Run করুন। স্টেপার বাছাই করে কয়েলের কারেন্ট দেখুন: প্রতি ধাপে সক্রিয় কয়েল বদলায়।' }
  ],
  explanation: {
    en: 'A stepper moves one fixed step per coil phase. Energising the coils in the order 1, 1-2, 2, 2-3, 3, 3-4, 4, 4-1 (half-step) turns the rotor smoothly. Reversing the order reverses the rotation. This sketch writes the phase pattern with digitalWrite, because the simulator models the coil pins; the Stepper library is not simulated.',
    bn: 'স্টেপার প্রতি কয়েল-ধাপে একটি নির্দিষ্ট ধাপ ঘোরে। কয়েলগুলো ১, ১-২, ২, ২-৩, ৩, ৩-৪, ৪, ৪-১ ক্রমে (হাফ-স্টেপ) চালালে রোটর মসৃণভাবে ঘোরে। ক্রম উল্টালে ঘূর্ণনও উল্টায়। এই স্কেচ ফেজ প্যাটার্ন digitalWrite দিয়ে লেখে, কারণ সিমুলেটর কয়েল পিন মডেল করে; Stepper লাইব্রেরি সিমুলেট হয় না।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_STEPPER),
    C('stp', 'stepper-28byj', 300, 60, { steps: 0 })
  ],
  wires: [
    W('w1', 'stp.in1', 'uno.D8', 'yellow'),
    W('w2', 'stp.in2', 'uno.D10', 'yellow'),
    W('w3', 'stp.in3', 'uno.D9', 'yellow'),
    W('w4', 'stp.in4', 'uno.D11', 'yellow'),
    W('w5', 'stp.vcc', 'uno.5V', 'red'),
    W('w6', 'stp.gnd', 'uno.GND_B1', 'black')
  ]
};

const logicAnalyzer: ExampleProject = {
  id: 'uno-logic-analyzer',
  name: 'Logic analyser: two digital signals',
  title: { en: 'Logic analyser on two digital pins', bn: 'দুটি ডিজিটাল পিনে লজিক অ্যানালাইজার' },
  summary: {
    en: 'A logic analyser on D13 and D12 shows two digital signals with different timing side by side.',
    bn: 'D13 ও D12-এ লজিক অ্যানালাইজার আলাদা সময়ের দুটি ডিজিটাল সিগন্যাল পাশাপাশি দেখায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place an Uno with the sketch and a logic analyser.', bn: 'স্কেচসহ Uno ও একটি লজিক অ্যানালাইজার বসান।' },
    { en: 'Analyser: D0 → D13, D1 → D12, GND → GND.', bn: 'অ্যানালাইজার: D0 → D13, D1 → D12, GND → GND।' },
    { en: 'Run and read the traces. D13 changes every 100 ms, D12 every 200 ms.', bn: 'Run করে ট্রেস দেখুন। D13 প্রতি ১০০ ms-এ, D12 প্রতি ২০০ ms-এ বদলায়।' }
  ],
  explanation: {
    en: 'A logic analyser samples several digital inputs and draws them as timing diagrams. It shows what the MCU actually does, which is useful for checking timing, protocols such as I²C or SPI, and bugs in delay logic. Here the two traces make the 2:1 timing ratio visible.',
    bn: 'লজিক অ্যানালাইজার একাধিক ডিজিটাল ইনপুট নমুনা নিয়ে টাইমিং ডায়াগ্রাম আঁকে। MCU আসলে কী করছে তা দেখায়, যা টাইমিং, I²C বা SPI প্রোটোকল এবং delay-এর ভুল যাচাইয়ে কাজে লাগে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_LA),
    C('la', 'logic-analyzer', 320, 40, { threshold: 2.5 })
  ],
  wires: [
    W('w1', 'la.d0', 'uno.D13', 'yellow'),
    W('w2', 'la.d1', 'uno.D12', 'green'),
    W('w3', 'la.gnd', 'uno.GND_B1', 'black')
  ]
};

const scopePwm: ExampleProject = {
  id: 'uno-scope-pwm',
  name: 'Oscilloscope on a PWM pin',
  title: { en: 'Oscilloscope on a PWM pin', bn: 'PWM পিনে অসিলোস্কোপ' },
  summary: {
    en: 'analogWrite(9, 128) produces a square wave at about half duty. The scope shows it on channel 1.',
    bn: 'analogWrite(9, 128) প্রায় অর্ধেক ডিউটিতে বর্গাকার তরঙ্গ দেয়। স্কোপ তা চ্যানেল ১-এ দেখায়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an Uno with the sketch, an oscilloscope, a 330 Ω resistor and a red LED.', bn: 'স্কেচসহ Uno, একটি অসিলোস্কোপ, ৩৩০ Ω রোধক ও লাল LED বসান।' },
    { en: 'D9 → scope CH1, D9 → 330 Ω → LED anode, LED cathode → GND. Scope GND → GND.', bn: 'D9 → স্কোপ CH1, D9 → ৩৩০ Ω → LED অ্যানোড, LED ক্যাথোড → GND। স্কোপ GND → GND।' },
    { en: 'Run. The trace shows the on and off levels of the PWM.', bn: 'Run করুন। ট্রেসে PWM-এর উপর ও নিচের স্তর দেখা যাবে।' }
  ],
  explanation: {
    en: 'A PWM output toggles between 0 V and 5 V. The duty value 128 out of 255 is about 50 %, so the time high and the time low are roughly equal. The oscilloscope view makes the duty cycle visible, which is the same thing the LED’s brightness depends on.',
    bn: 'PWM আউটপুট ০ V ও ৫ V-এর মধ্যে দোলে। ২৫৫-এর মধ্যে ১২৮ মানে প্রায় ৫০% ডিউটি, তাই উঁচু ও নিচু সময় প্রায় সমান। স্কোপে ডিউটি দেখা যায়, যার উপর LED-এর উজ্জ্বলতা নির্ভর করে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_SCOPE_PWM),
    C('scope', 'oscilloscope', 300, 40, {}),
    C('r', 'resistor', 300, 200, { ohms: 330 }),
    C('led', 'led-red', 420, 200, { color: 'red' })
  ],
  wires: [
    W('w1', 'scope.ch1', 'uno.D9', 'green'),
    W('w2', 'scope.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'uno.D9', 'r.a', 'yellow'),
    W('w4', 'r.b', 'led.anode', 'yellow'),
    W('w5', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const esp32Ledc: ExampleProject = {
  id: 'esp32-ledc-fade',
  name: 'ESP32 hardware PWM fade (LEDC)',
  title: { en: 'ESP32 hardware PWM fade (LEDC)', bn: 'ESP32 হার্ডওয়্যার PWM ফেড (LEDC)' },
  summary: {
    en: 'The ESP32’s LEDC peripheral generates a 5 kHz PWM on GPIO25 to fade an LED smoothly.',
    bn: 'ESP32-র LEDC পেরিফেরাল GPIO25-এ ৫ kHz PWM দিয়ে LED মসৃণভাবে ফেড করে।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place an ESP32 DevKit with the sketch, a 100 Ω resistor and a red LED.', bn: 'স্কেচসহ ESP32 DevKit, ১০০ Ω রোধক ও লাল LED বসান।' },
    { en: 'GPIO25 (D25) → 100 Ω → LED anode, LED cathode → GND.', bn: 'GPIO25 (D25) → ১০০ Ω → LED অ্যানোড, LED ক্যাথোড → GND।' },
    { en: 'Run and watch the LED fade up and down.', bn: 'Run করে LED-এর উজ্জ্বলতা ওঠানামা দেখুন।' }
  ],
  explanation: {
    en: 'The ESP32 has no analogWrite-only PWM in the same way as the Uno. ledcSetup defines a channel with a frequency and an 8-bit resolution, and ledcAttachPin ties a GPIO to that channel. ledcWrite then sets the duty directly. The hardware keeps the PWM running while the MCU does other work.',
    bn: 'ESP32-তে Uno-র মতো analogWrite-ই PWM-এর একমাত্র উপায় নয়। ledcSetup একটি চ্যানেল তৈরি করে (কম্পাঙ্ক ও ৮-বিট রেজোলিউশন), ledcAttachPin GPIO-কে সেই চ্যানেলে যুক্ত করে, ledcWrite ডিউটি ঠিক করে। হার্ডওয়্যার PWM চালাতে থাকে।'
  },
  components: [
    C('esp', 'esp32-devkit-30', 20, 60, {}, SKETCH_LEDC),
    C('r', 'resistor', 300, 80, { ohms: 100 }),
    C('led', 'led-red', 420, 80, { color: 'red' })
  ],
  wires: [
    W('w1', 'esp.D25', 'r.a', 'yellow'),
    W('w2', 'r.b', 'led.anode', 'yellow'),
    W('w3', 'led.cathode', 'esp.GND', 'black')
  ]
};

export const MCU_PROJECTS: ExampleProject[] = [
  buttonLed,
  breathingLed,
  buzzerMelody,
  pirAlarm,
  touchLamp,
  soilPump,
  gasAlarm,
  dht22Serial,
  bmp280Serial,
  oledCounter,
  lcdParallel,
  lcdUptime,
  servoPot,
  stepperSweep,
  logicAnalyzer,
  scopePwm,
  esp32Ledc
];
