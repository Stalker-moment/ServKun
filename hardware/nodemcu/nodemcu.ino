#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>

//pin define
#define RST_TRIG D0
#define DHTPIN D2
#define DHTTYPE DHT22
#define COOLER D1
#define delayStart 500

DHT dht(DHTPIN, DHTTYPE);

const char* ssid = "Sinyo Home";      // Ganti dengan SSID WiFi Anda
const char* password = "Tier010707";  // Ganti dengan password WiFi Anda

//DEFINE VARIABLE
int CoolerId = 1;
int SensorId = 1;
int defaultSpeed = 50;
int lastSpeed = 50;
int systemTemperature = 40;
int minimalTemperature = 40;
int maximalTemperature = 100;
int percentageTempMode = 0;
int percentageClockMode = 0;
String apikey = "iniapikeydevices";
String base_url = "http://servapi.tierkun.my.id/api";
String lastMode = "DEFAULT";

bool stats;    //variable state request code
bool state;    //vdad
bool restart;  //value restart from API

String APIHealt;
float t, h;
String temp;
String humi;

void setup() {
  Serial.begin(115200);
  delay(100);
  dht.begin();
  connectWifi();
}

void loop() {
  getMode();
  readDHT();

  if (APIHealt == "Yes") {
    if (lastMode == "MANUAL") {
      setCooler(lastSpeed);
      updateCooler(lastSpeed, "MANUAL");
    } else if (lastMode == "ATEMP") {
      tempMode();
    } else if (lastMode == "ACLOCK") {
      clockMode();
    } else {
      defaultMode();
    }
  } else {
  }

  delay(1000);
}

void tempMode() {
  getSystem();  // Memanggil fungsi untuk mendapatkan nilai sistem

  // Pemetaan nilai ke dalam persentase
  if (systemTemperature <= minimalTemperature) {
    percentageTempMode = 0;
  } else if (systemTemperature >= maximalTemperature) {
    percentageTempMode = 100;
  } else {
    percentageTempMode = map(systemTemperature, minimalTemperature, maximalTemperature, 0, 100);
  }

  setCooler(percentageTempMode);
  updateCooler(percentageTempMode, "ATEMP");
}


void clockMode() {
  determinePercentage();
  updateCooler(percentageClockMode, "ACLOCK");
}

void defaultMode() {
  setCooler(defaultSpeed);
  updateCooler(defaultSpeed, "DEFAULT");
}

void updateCooler(int speed, String mode) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    String url = base_url + "/cooler/data";

    Serial.print("Sending HTTP POST request to: ");
    Serial.println(url);

    WiFiClient client;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument requestBody(1024);
    requestBody["apikey"] = apikey;
    requestBody["coolerId"] = CoolerId;
    requestBody["mode"] = mode;
    requestBody["speed"] = speed;

    String requestBodyString;
    serializeJson(requestBody, requestBodyString);

    int httpCode = http.POST(requestBodyString);

    Serial.println(httpCode);
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Response payload:");
        Serial.println(payload);

        // Parsing JSON
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, payload);

        lastMode = doc["latestData"]["mode"].as<String>();
        lastSpeed = doc["latestData"]["speed"].as<int>();

        APIHealt = "Yes";
      } else {
        Serial.print("HTTP response code: ");
        Serial.println(httpCode);
        APIHealt = "No";
      }
    } else {
      Serial.print("HTTP request failed with error code: ");
      Serial.println(http.errorToString(httpCode).c_str());
      APIHealt = "No";
      lastMode = "DEFAULT";
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void getMode() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    String url = base_url + "/device/data-cooler";

    Serial.print("Sending HTTP POST request to: ");
    Serial.println(url);

    WiFiClient client;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument requestBody(1024);
    requestBody["apikey"] = apikey;
    requestBody["id"] = CoolerId;

    String requestBodyString;
    serializeJson(requestBody, requestBodyString);

    int httpCode = http.POST(requestBodyString);

    Serial.println(httpCode);
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Response payload:");
        Serial.println(payload);

        // Parsing JSON
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, payload);

        lastMode = doc["latestData"]["mode"].as<String>();
        lastSpeed = doc["latestData"]["speed"].as<int>();

        APIHealt = "Yes";
      } else {
        Serial.print("HTTP response code: ");
        Serial.println(httpCode);
        APIHealt = "No";
      }
    } else {
      Serial.print("HTTP request failed with error code: ");
      Serial.println(http.errorToString(httpCode).c_str());
      APIHealt = "No";
      lastMode = "DEFAULT";
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void getSystem() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    String url = base_url + "/device/data-system";

    Serial.print("Sending HTTP POST request to: ");
    Serial.println(url);

    WiFiClient client;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument requestBody(1024);
    requestBody["apikey"] = apikey;

    String requestBodyString;
    serializeJson(requestBody, requestBodyString);

    int httpCode = http.POST(requestBodyString);

    Serial.println(httpCode);
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Response payload:");
        Serial.println(payload);

        // Parsing JSON
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, payload);

        int temp = doc["cpuTemperature"].isNull() ? 60 : doc["cpuTemperature"].as<int>();
        systemTemperature = temp;

        APIHealt = "Yes";
      } else {
        Serial.print("HTTP response code: ");
        Serial.println(httpCode);
        APIHealt = "No";
      }
    } else {
      Serial.print("HTTP request failed with error code: ");
      Serial.println(http.errorToString(httpCode).c_str());
      APIHealt = "No";
      lastMode = "DEFAULT";
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void determinePercentage() {
  String clock = getClockFromAPI();
  if (clock != "") {
    // Extract time in HH:MM:SS format
    int hour = clock.substring(0, 2).toInt();

    if (hour >= 6 && hour < 18) {
      percentageClockMode = 60;  // 6 AM to 6 PM
    } else {
      percentageClockMode = 30;  // 6 PM to 6 AM
    }
  } else {
    percentageClockMode = 30;
  }
}

String getClockFromAPI() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    String url = base_url + "/device/data-clock";

    Serial.print("Sending HTTP POST request to: ");
    Serial.println(url);

    WiFiClient client;
    http.begin(client, url);

    int httpCode = http.GET();

    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Response:");
        Serial.println(payload);

        // Parsing JSON
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          String clock = doc["clock"];  // Ambil clock dari JSON

          // Print the clock format to verify
          Serial.print("Clock: ");
          Serial.println(clock);

          return clock;  // Return the clock string
        } else {
          Serial.print("JSON parsing failed: ");
          Serial.println(error.c_str());
          return "";
        }
      }
    } else {
      Serial.print("Error on HTTP request: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  return "";
}

void connectWifi() {
  // Menghubungkan ESP8266 ke jaringan WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

void RST_DEVICE() {
  pinMode(RST_TRIG, OUTPUT);
  digitalWrite(RST_TRIG, LOW);
  delay(delayStart);
  digitalWrite(RST_TRIG, HIGH);
}

void readDHT() {
  h = dht.readHumidity();
  t = dht.readTemperature();
  temp = String(t);
  humi = String(h);

  if (isnan(h) || isnan(t)) {
    h = 0;
    t = 0;
    temp = String(t);
    humi = String(h);
    Serial.println("Failed to read from DHT sensor!");
  }

  Serial.println(temp);
  Serial.println(humi);

  //ApiDHT(temp, humi);
}

void setCooler(int speed) {
  int pwmValue;

  if (speed >= 0 && speed <= 80) {
    // Map nilai 0-80 ke rentang 0-512
    pwmValue = map(speed, 0, 80, 0, 200);
  } else if (speed >= 81 && speed <= 100) {
    // Map nilai 81-100 ke rentang 513-1023
    pwmValue = map(speed, 81, 100, 201, 380);
  }

  Serial.println(pwmValue);

  // Menulis nilai PWM ke pin COOLER
  analogWrite(COOLER, pwmValue);
}
