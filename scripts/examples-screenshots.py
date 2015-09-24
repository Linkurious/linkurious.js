#! /usr/bin/python3
"""
Take screenshots of all the examples

Use `python3 -m http.server` to serve your files

Dependencies:
  - python 3
  - selenium (`sudo pip3 install selenium`)
  - firefox
"""
from selenium import webdriver
import time, os

SERVER_URL = "http://127.0.0.1:8000/examples/"
EXAMPLES_DIR = '../examples'
DESTINATION = EXAMPLES_DIR+'/screens'

driver = webdriver.Firefox()

#find the links to the examples
from os import listdir
from os.path import isfile, join
l = [ f for f in listdir(EXAMPLES_DIR) if isfile(join(EXAMPLES_DIR,f)) \
	and '.html' in f and 'index.html' not in f]

for a in l:
    name = a.replace('.html','')
    print(name)
    driver.get(SERVER_URL+a) #go to page
    time.sleep(4) #wait for things to setup
    driver.save_screenshot(DESTINATION+name+'.png')
driver.quit()