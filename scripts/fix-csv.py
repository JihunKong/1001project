#!/usr/bin/env python3
import csv

input_file = '/Users/jihunkong/1001project/1001-stories/locales/translations.csv'
output_file = '/Users/jihunkong/1001project/1001-stories/locales/translations-fixed.csv'

with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)

    for row in reader:
        writer.writerow(row)

print(f"Fixed CSV written to {output_file}")
