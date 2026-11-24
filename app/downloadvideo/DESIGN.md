---
name: Video downloader
description: Implemented design for /downloadvideo on the Jelle Wijma portfolio.
colors:
  background: "#050505"
  ink: "#f5f5f5"
  muted: "#a3a3a3"
  rule: "#ffffff26"
---

## Overview

This route follows the existing black and white portfolio. The heading leads directly into one download form for YouTube and Vimeo links. The video thumbnail provides the only imagery.

## Colors

Ink carries headings and primary actions. Muted text supplies help and metadata. Thin rules divide the form, video details, format choices and download status. Errors use a restrained red background and readable pale text.

## Typography

The page inherits the site's sans-serif stack. The heading scales from 40px to 64px on desktop, with tight tracking. Labels, metadata and buttons use smaller sizes. Progress percentages and duration use tabular numerals.

## Layout

The centered container has a maximum width of 1000px. At 680px and below, padding reduces, the link input and action stack vertically, and video details use a compact two-column layout.

## Elevation & Depth

Flat surfaces and 1px borders establish hierarchy without shadows.

## Shapes

Controls have square corners. Circular marks identify radio selection and loading.

## Components

`page.tsx` supplies noindex metadata. `downloader.tsx` calls the same-origin API for video information, job creation, polling and cancellation. The API forwards requests to the persistent backend. Ready files download through an HTTPS attachment link that expires after one hour.

Video defaults to Best available. Resolution options come from the video's available streams. The first option shows the highest available resolution, and individual choices include labels for 4K and 8K. Portrait videos use their shorter dimension for quality labels. The format choices are MKV video, MP4 video and MP3 audio. MKV and MP4 package the available video streams without re-encoding. The ready action names the file type. The visible file limit is 10 GB.

Progress uses actual backend values and `scaleX`. Keyboard focus, status announcements, errors and disabled states are explicit. Reduced-motion preferences remove animation.
