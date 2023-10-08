# Nunti

Finally a smart RSS reader which doesn't suck ass or your data.

![F-Droid version](https://img.shields.io/f-droid/v/com.nunti)
![Gitlab release](https://img.shields.io/gitlab/v/release/24697319)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/nunti)

[![patreon](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/nunti)  

# Installation

## For users

<a href="https://f-droid.org/en/packages/com.nunti/"><img src="https://fdroid.gitlab.io/artwork/badge/get-it-on.png" height="75"></a>

Alternatively you can download the apk for any version on the [releases page](https://gitlab.com/ondrejfoltyn/nunti/-/releases).

## For developers

1. clone the repository
2. enter the `Nunti` directory
3. run `npm install --omit=optional --legacy-peer-deps` to install dependencies
4. connect your phone (or run an emulator) and make sure adb can find your device
5. run `npx react-native start` in one terminal window
6. run `npx react-native run-android` in the second terminal window to build

# Features

### Adaptive learning

Nunti lets you rate articles and then uses an advanced algorithm to sort new articles based on your preferences. Learn more about the adaptive learning [here](https://gitlab.com/ondrejfoltyn/nunti/-/issues/28).

### Modern material design

Nunti implements [Material Design V3](https://m3.material.io/) to finally create an open-source app that doesn't just feel right, but also looks right.

<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/04.jpg" alt="Nunti feed" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/06.jpg" alt="Nunti rate" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg" alt="Nunti settings" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/05.jpg" alt="Nunti web" width="20%">

### Theming options

Nunti lets you customise the look of the app with a range of predefined accent colours, as well as your system [Material You](https://m3.material.io/styles/color/dynamic-color/overview) colour when running Android 12 and newer.

<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/12.jpg" alt="Nunti theme" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/13.jpg" alt="Nunti accent" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/14.jpg" alt="Nunti changed" width="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg" alt="Nunti changed 2" width="20%">

### Import and export functions

Since your data never leaves Nunti, you can easily export and then import your data to your device.

### Absolute privacy

Nunti has been built with the firm belief that there is no reason to process or store any personal data in the cloud. As such Nunti never sends any of your data anywhere, and the only internet connections it makes are `GET` requests to your rss feeds, which are further anonymised by using a random common user-agent.

# Credits and contributors

- @stepano_, @qwrtln - Polish translation
- Eliška Otčenášková, @ngnee - German translation
- @AntoninDelFabbro - French translation
- @marcomarcobello - Italian translation
- @vitorhcl, @marssaljr - Brazilian Portuguese translation
- @vaf0 - Japanese translation

### Contribute a translation

The preferred way to contribute is to create a public fork of the project and create a merge request. A short guide on how to provide a new translation: 
1. Fork the project. Make sure the repo is public, so that we can access your merge request later.
2. Open up `Nunti/src/Locale.ts`. This is where all the languages are stored in json format.
3. Copy and paste the language you are going to be translating from.
4. Change the object name to your the new language name (`const English` to `const x`).
5. After you finish the translation, create a merge request. :tada: 

# Licence, disclaimer or whatever

Nunti Copyright &copy; 2021 - 2023  Ondřej Foltýn & Richard Klapáč

> This program is free software: you can redistribute it and/or modify
> it under the terms of the **GNU General Public License** as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
> 
> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
> GNU General Public License for more details.
> 
> You should have received a copy of the GNU General Public License
> along with this program.  If not, see <https://www.gnu.org/licenses/>.
