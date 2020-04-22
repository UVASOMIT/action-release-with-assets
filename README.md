# action-release-with-assets

GitHub Actions: GitHub Release Action with Asset Attachment

## Origins

Forked from [Sondre Bjellås](https://github.com/sondreb/action-release) who was using it for draft releases with a manual final release.

## Usage

Here is an example on how to use this GitHub Action:

```
    - name: Release
      uses: sondreb/action-release@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commitish: dev
        files: ./release/app.zip
        prerelease: false
        body: This is a release
        name: Draft Release
        tag: v0.0.1
```
