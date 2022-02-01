# Nunti

Finally a smart RSS reader which doesn't suck ass or your data.

![F-Droid version](https://img.shields.io/f-droid/v/com.nunti.svg)
![Gitlab release](https://img.shields.io/gitlab/v/release/24697319)

# Installation

## For users

<a href="https://f-droid.org/en/packages/com.nunti/"><img src="https://fdroid.gitlab.io/artwork/badge/get-it-on.png" height="75"></a>

Or alternatively you can download the apk for any version over at our [releases page](https://gitlab.com/ondrejfoltyn/nunti/-/releases).

## For developers

1. clone the repository
2. enter the `Nunti` directory
3. run `npm install --no-optional` to install dependencies
4. connect your phone and make sure adb can find your device
5. run `npx react-native start` in one terminal
6. run `npx react-native run-android` in the second terminal to build

# Features

### Adaptive learning

Nunti allows you to rate articles and then uses an advanced algorithm to sort new articles depending on which topics interest you the most.

### Modern material design

Nunti implements all the best practices of material design to finally create an open-source app that doesn't just feel right, but also looks right.

<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/03.jpg" alt="Nunti feed" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/04.jpg" alt="Nunti rate" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/06.jpg" alt="Nunti settings" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/13.jpg" alt="Nunti web" width="20%" height="20%">

### Theming options

Nunti allows you to customise the look of the app to make it unique to you. Nunti also supports the new dynamic theme system "Material You" to get just the right accent colour from your wallpaper.

<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/09.jpg" alt="Nunti theme" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/10.jpg" alt="Nunti accent" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/11.jpg" alt="Nunti changed" width="20%" height="20%">
<img src="https://gitlab.com/ondrejfoltyn/nunti/-/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/12.jpg" alt="Nunti changed 2" width="20%" height="20%">

### Import and export functions

Since Nunti never sends your data out of your device, you can easily export and then import your data including your rating preferences to your device.

### Absolute privacy

Nunti has been built with the firm belief that there is no reason to process or store any personal data in the cloud. As such Nunti never sends any of your data anywhere, and the only internet connections it makes are `GET` requests to your rss feeds. 

# Development

(Maintainers only) When creating a new version of the app (update fdroid) you must do these things:

1. change the version in `Nunti/package.json` (used to display the app version in the about page of the app)
2. change the version code and name in `Nunti/android/app/build.gradle`
3. add changelogs into the fastline structure named `{version code}.txt`
4. add the same version code tag to the commit

# Credits and contributors

- @stepano_ - polish translation
- Eliška Otčenášková, @ngnee - german translation
- @AntoninCurtit - french translation

# Licence, disclaimer or whatever

Nunti Copyright &copy; 2021  Ondřej Foltýn & Richard Klapáč

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
