# measure-temp.py
# Measure temperature using mpc3008 chip and tmp36 diode
# Author: Jon Fowler
# Includes public domain code from Tony DiCola
# https://github.com/adafruit/Adafruit_Python_MCP3008/blob/master/examples/simpletest.py

import time
import datetime
import decimal
import os
import requests
from dotenv import load_dotenv

# Import SPI library (for hardware SPI) and MCP3008 library.
import Adafruit_GPIO.SPI as SPI
import Adafruit_MCP3008

load_dotenv()
POST_URL = os.getenv('API_URL')
HEADERS = { 'Content-type': application/json' }

tempChannel = 0
tempList=[]


# Software SPI configuration:
CLK  = 18
MISO = 23
MOSI = 24
CS   = 25
mcp = Adafruit_MCP3008.MCP3008(clk=CLK, cs=CS, miso=MISO, mosi=MOSI)

# Hardware SPI configuration:
# SPI_PORT   = 0
# SPI_DEVICE = 0
# mcp = Adafruit_MCP3008.MCP3008(spi=SPI.SpiDev(SPI_PORT, SPI_DEVICE))

def ConvertTemp(data,places,farenheit):

  # ADC Value
  # (approx)  Temp  Volts
  #    0      -50    0.00
  #   78      -25    0.25
  #  155        0    0.50
  #  233       25    0.75
  #  310       50    1.00
  #  465      100    1.50
  #  775      200    2.50
  # 1023      280    3.30

  temp = ((data * 330)/float(1023))-50
  if farenheit:
      temp = temp * (9/5) + 32
  temp = round(temp,places)
  return temp

def measure_cpu_temp():
    temp = os.popen("vcgencmd measure_temp").readline()
    temp = temp.replace("temp=","").replace("'C","").replace("\n",'').replace("\r",'')
    return temp

# Main program loop.
while True:
    # The read_adc function will get the value of the specified channel (0-7).
    temp = ConvertTemp(mcp.read_adc(tempChannel),1,False)
    tempList.append(temp)
    if(len(tempList)==10):
        avgTemp = sum(tempList)/len(tempList)
        output = { 'temp': avgTemp }
        r = requests.post(API_URL, data=json.dumps(output), headers=HEADERS)
        print(output)
        print(r.text)
        tempList=[]
    time.sleep(1)
