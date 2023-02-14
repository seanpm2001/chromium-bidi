/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');

function readReport(filePath) {
  const rawReport = fs.readFileSync(filePath);
  return JSON.parse(rawReport);
}

function calculate(report) {
  const result = {all: 0, pass: 0, fail: 0};
  for (const r of report.results) {
    for (const s of r.subtests) {
      result.all++;
      if (s.status === 'PASS') {
        result.pass++;
      } else {
        result.fail++;
      }
    }
  }
  return result;
}

function getReportPath() {
  return process.argv.slice(2)[0];
}

const result = calculate(readReport(getReportPath()));

console.log(result);
