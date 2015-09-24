#! /usr/bin/python3
"""
Check for errors on all the pages

Use `python3 -m http.server` to serve your files

Dependencies:
  - python 3
  - selenium (`sudo pip3 install selenium`)
  - firefox
"""
from selenium import webdriver
import time, os
from os.path import isfile, join

SERVER_URL = "http://127.0.0.1:8000/examples/"
EXAMPLES_DIR = '../examples'
#DESTINATION = 'screens/'

driver = webdriver.Firefox()

#empty the useless messages
for entry in driver.get_log('browser'):
	pass

#find the links to the examples
l = [ f for f in os.listdir(EXAMPLES_DIR) if isfile(join(EXAMPLES_DIR,f)) \
	and '.html' in f and 'index.html' not in f]

for a in l:
    name = a.replace('.html','')
    print(name)
    driver.get(SERVER_URL+a) #go to page
    time.sleep(0.2) #wait for things to setup
    for entry in driver.get_log('browser'):
        if entry['level'] not in ('INFO','WARNING'):
            print(entry['level'],entry['message'])
    #driver.save_screenshot(DESTINATION+name+'.png')
driver.quit()