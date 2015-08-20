#! /usr/bin/python3
"""
Take screenshots of all the examples

Use `python3 -m http.server` to serve your files

You need to remove examples/index.html for files to be listed

Dependencies:
  - python 3
  - selenium (`sudo pip3 install selenium`)
  - firefox
"""

from selenium import webdriver
import time, re, os.path

INDEX_URL = "http://127.0.0.1:8000/examples"
DESTINATION = '../examples/screens/' if sys.

driver = webdriver.Firefox()
driver.get(INDEX_URL)

#find the links to the examples
l = driver.find_elements_by_tag_name('a')
l = [x.get_attribute('href') for x in l]
l = [x for x in l if x.endswith('.html') and '/index.html' not in x]

print(len(l),'links found')

for a in l:
    name = a.split('/')[-1].replace('.html','')
    print(name)
    driver.get(a) #go to page
    time.sleep(4) #wait for things to setup
    driver.save_screenshot(DESTINATION+name+'.png')
driver.quit()