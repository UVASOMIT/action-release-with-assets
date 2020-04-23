# action-release-with-assets

GitHub Actions: GitHub Release Action with Asset Attachment

## Introduction

This GitHub Action is for creating a release in draft form, uploading assets to that draft, and then updating the release to remove the draft status. In this way, any GitHub webhook release events with `release` or `published` actions will have the assets attached. This prevents problems where webhooks might receive the release event before the assets are attached (preventing the immediate download of assets).

## Usage

Here is an example on how to use this GitHub Action:

```
    - name: Release with Assets
      uses: UVASOMIT/action-release-with-assets@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commitish: dev
        files: ./release/app.zip
        prerelease: false
        body: This is a release
        name: Draft Release
        tag: v0.0.1
```

## TODO

Since this is a fork of an existing repository, there is room for improvement in patterns, practices, and technology. Ideally, this would be converted to TypeScript in the near future with tweaks to optimize the code. Currently, you can consider it in an alpha state. Just enough was done to modify the original repository in order to get it working.

## Credits

Forked from [Sondre Bjellås](https://github.com/sondreb/action-release) who was using it for draft releases with a manual final release.
