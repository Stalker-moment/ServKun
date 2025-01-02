import React, { useEffect, useState } from "react";
import { dataStats } from "@/types/dataStats";
import { FaCloudRain, FaTemperatureHigh } from "react-icons/fa";
import { WiHumidity } from "react-icons/wi";
import { BsMoisture } from "react-icons/bs";
import { RiWaterPercentFill } from "react-icons/ri";
import { PiApproximateEqualsBold } from "react-icons/pi";
import { FaWind } from "react-icons/fa";
import { GiMultiDirections } from "react-icons/gi";
import Cookies from "js-cookie";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

// Definisikan tipe data yang diterima dari WebSocket
interface EnvTemp {
  temp: number;
  humidity: number;
  tempDiff: number;
  humidityDiff: number;
  lastUpdate: string;
  tempUnit: string;
  humidityUnit: string;
}

interface Anemo {
  speed: Number;
  speedDiff: Number;
  direction: Number;
  directionDiff: Number;
  lastUpdate: String;
  speedUnit: String;
  directionUnit: String;
}

interface Rain {
  rainValue: Number;
  rainDiff: Number;
  lastUpdate: String;
  rainUnit: String;
}

const DataStatsOne: React.FC<dataStats> = () => {
  const [data, setData] = useState<EnvTemp | null>(null);
  const [anemo, setAnemo] = useState<Anemo | null>(null);
  const [rain, setRain] = useState<Rain | null>(null);
  const token = Cookies.get("userAuth");

  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5000; // Set the maximum number of reconnection attempts
    const reconnectDelay = 3000; // Delay between reconnection attempts (in ms)

    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://${HTTPSAPIURL}/envtemp?token=${token}`);

      ws.onmessage = (event) => {
        const receivedData: EnvTemp = JSON.parse(event.data);
        setData(receivedData);
      };

      ws.onopen = () => {
        reconnectAttempts = 0;
        console.log("WebSocket connection opened");
      };

      if (ws)
        ws.onclose = (event) => {
          if (!event.wasClean) {
            console.log(
              `WebSocket closed unexpectedly. Reconnecting attempt #${reconnectAttempts + 1}`,
            );
            if (reconnectAttempts < maxReconnectAttempts) {
              setTimeout(() => {
                reconnectAttempts++;
                connectWebSocket();
              }, reconnectDelay);
            } else {
              console.error(
                "Max reconnection attempts reached. WebSocket connection failed.",
              );
            }
          }
        };

      return () => {
        ws.close();
      };
    };

    connectWebSocket();
  }, []);

  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5000; // Set the maximum number of reconnection attempts
    const reconnectDelay = 3000; // Delay between reconnection attempts (in ms)

    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://${HTTPSAPIURL}/anemo?token=${token}`);

      ws.onmessage = (event) => {
        const receivedData: Anemo = JSON.parse(event.data);
        setAnemo(receivedData);
      };

      ws.onopen = () => {
        reconnectAttempts = 0;
        console.log("WebSocket connection opened");
      };

      if (ws)
        ws.onclose = (event) => {
          if (!event.wasClean) {
            console.log(
              `WebSocket closed unexpectedly. Reconnecting attempt #${reconnectAttempts + 1}`,
            );
            if (reconnectAttempts < maxReconnectAttempts) {
              setTimeout(() => {
                reconnectAttempts++;
                connectWebSocket();
              }, reconnectDelay);
            } else {
              console.error(
                "Max reconnection attempts reached. WebSocket connection failed.",
              );
            }
          }
        };

      return () => {
        ws.close();
      };
    };

    connectWebSocket();
  }, []);

  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5000; // Set the maximum number of reconnection attempts
    const reconnectDelay = 3000; // Delay between reconnection attempts (in ms)

    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://${HTTPSAPIURL}/rain?token=${token}`);

      ws.onmessage = (event) => {
        const receivedData: Rain = JSON.parse(event.data);
        setRain(receivedData);
        console.log(receivedData);
      };

      ws.onopen = () => {
        reconnectAttempts = 0;
        console.log("WebSocket connection opened");
      };

      if (ws)
        ws.onclose = (event) => {
          if (!event.wasClean) {
            console.log(
              `WebSocket closed unexpectedly. Reconnecting attempt #${reconnectAttempts + 1}`,
            );
            if (reconnectAttempts < maxReconnectAttempts) {
              setTimeout(() => {
                reconnectAttempts++;
                connectWebSocket();
              }, reconnectDelay);
            } else {
              console.error(
                "Max reconnection attempts reached. WebSocket connection failed.",
              );
            }
          }
        };

      return () => {
        ws.close();
      };
    };

    connectWebSocket();
  }
  , []);

  const dataStatsList = [
    {
      icon: <FaTemperatureHigh size={26} color="white" />,
      color: "#3FD97F",
      title: "Avg. Temperature",
      value: data ? `${data.temp} ${data.tempUnit}` : "Loading...",
      growthRate: data ? data.tempDiff : 0,
      growthUnit: data ? data.tempUnit : "",
    },
    {
      icon: <WiHumidity size={40} color="white" />,
      color: "#FF9C55",
      title: "Avg. Humidity",
      value: data ? `${data.humidity} ${data.humidityUnit}` : "Loading...",
      growthRate: data ? data.humidityDiff : 0,
      growthUnit: data ? data.humidityUnit : "",
    },
    {
      icon: <FaWind size={26} color="white" />,
      color: "#8155FF",
      title: "Wind Speed",
      value: anemo ? `${anemo.speed} ${anemo.speedUnit}` : "Loading...",
      growthRate: anemo ? anemo.speedDiff : 0,
      growthUnit: anemo ? anemo.speedUnit : "",
    },
    {
      icon: <GiMultiDirections size={26} color="white" />,
      color: "#3FD97F",
      title: "Wind Direction",
      value: anemo ? `${anemo.direction} ${anemo.directionUnit}` : "Loading...",
      growthRate: anemo ? anemo.directionDiff : 0,
      growthUnit: anemo ? anemo.directionUnit : "",
    },
    {
      icon: <FaCloudRain size={26} color="white" />,
      color: "#8155FF",
      title: "Avg. Rain",
      value: rain ? `${rain.rainValue} ${rain.rainUnit}` : "Loading...",
      growthRate: rain ? rain.rainDiff : 0,
      growthUnit: rain ? rain.rainUnit : "",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      {dataStatsList.map((item, index) => (
        <div
          key={index}
          className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
        >
          <div
            className="flex h-14.5 w-14.5 items-center justify-center rounded-full"
            style={{ backgroundColor: item.color }}
          >
            {item.icon}
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                {item.value}
              </h4>
              <span className="text-body-sm font-medium">{item.title}</span>
            </div>

            <span
              className={`flex items-center gap-1.5 text-body-sm font-medium ${
                Number(item.growthRate) === 0 ? "text-gray" :
                Number(item.growthRate) > 0 ? "text-green" : "text-red"
              }`}
            >
              {item.growthRate.toString()}
              {item.growthUnit}
              {
              Number (item.growthRate) === 0 ? (
                <PiApproximateEqualsBold size={16} />
              ) :
              Number(item.growthRate) > 0 ? (
                <svg
                  className="fill-current"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.35716 2.3925L0.908974 5.745L5.0443e-07 4.86125L5 -5.1656e-07L10 4.86125L9.09103 5.745L5.64284 2.3925L5.64284 10L4.35716 10L4.35716 2.3925Z"
                    fill=""
                  />
                </svg>
              ) : (
                <svg
                  className="fill-current"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.64284 7.6075L9.09102 4.255L10 5.13875L5 10L-8.98488e-07 5.13875L0.908973 4.255L4.35716 7.6075L4.35716 7.6183e-07L5.64284 9.86625e-07L5.64284 7.6075Z"
                    fill=""
                  />
                </svg>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataStatsOne;
