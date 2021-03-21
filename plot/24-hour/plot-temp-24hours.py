'''
    plot-temp-24hours.py

    Plot the last 24-hour period of measured temperatures from the WeatherPi
    API. The plot automatically updates and re-plots data.
'''
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.dates as md
import requests as req
import json
from dotenv import load_dotenv
import os
import datetime as dt

# requires .env file with the following variables:
# API_SECURE=[True/False]
# API_HOST=[hostname/IP]
# API_PORT=[port number]
load_dotenv()

API_PROTOCOL = 'http' + ('s' if os.getenv('API_SECURE') == 'True' else '')
API_URL = (API_PROTOCOL +
           '://' +
           os.getenv('API_HOST') +
           ':' + os.getenv('API_PORT') +
           '/temp/24hours')    # http[s]://[hostname]:[port]/temp/24hours
DT_FORMAT = '%Y-%m-%d %H:%M:%S'
XFMT = md.DateFormatter(DT_FORMAT)
DEGREE_SIGN = u'\N{DEGREE SIGN}'
UPDATE_INTERVAL = 60000     # 1 minute
VERBOSE = True

# init plotting variables
fig = plt.figure()
ax1 = fig.add_subplot(1, 1, 1)


# animate function is run at each update interval
def animate(i):
    now = dt.datetime.now()
    datetime_min = now - dt.timedelta(days=1)

    # request data from WeatherPi server
    d = req.get(API_URL)
    data = json.loads(d.text)

    x = []
    y = []

    # iterate through data and add to x and y arrays to be plotted
    for i in data:
        x = np.append(x, i["ts"])
        y = np.append(y, i["temp"])

    # format timestamp data
    x = [dt.datetime.fromtimestamp(ts / 1000) for ts in x]

    # set min/max variables
    x_min = x[0]
    x_max = x[len(x)-1]
    y_max = y[len(y)-1]
    y_min = min(y)
    x_min_lim = datetime_min.replace(microsecond=0,
                                     second=0,
                                     minute=0) - dt.timedelta(hours=1)
    x_max_lim = now.replace(microsecond=0,
                            second=0,
                            minute=0) + dt.timedelta(hours=1)

    # clear the subplot to prepare for the new subplot to be graphed
    ax1.clear()

    ax1.xaxis.set_major_formatter(XFMT)
    ax1.tick_params('x', labelrotation=25)
    ax1.set_xlim([x_min_lim, x_max_lim])

    # these are matplotlib.patch.Patch properties
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)

    # text to show in the info box
    textstr = ('Latest Reading:\n' +
               str(y_max) + ' ' +
               DEGREE_SIGN + 'C' +
               '\n' +
               str(x_max.replace(microsecond=0)))

    # place a text box in upper left in axes coords
    ax1.text(0.05,
             0.95,
             textstr,
             transform=ax1.transAxes,
             fontsize=14,
             verticalalignment='top',
             bbox=props)

    ax1.set_ylabel('Measured Temperature (C)')
    ax1.set_title('WeatherPi - 24-Hour Temperatures')

    ax1.plot(x, y, '.', color='black')

    if VERBOSE:
        print(x_min_lim)
        print(x_max_lim)
        print(x[len(x)-1].strftime(DT_FORMAT))
        print(textstr)


# create animation process
ani = animation.FuncAnimation(fig, animate, interval=UPDATE_INTERVAL)

# attempt to display graph in a maximized window
plt.get_current_fig_manager().window.state('zoomed')
plt.show()
