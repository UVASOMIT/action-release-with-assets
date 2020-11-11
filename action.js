//@ts-check

require('child_process')
    .execSync(
        'npm install @actions/core @actions/github mime',
        { cwd: __dirname }
    );

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    function getFile(filePath) {
        return {
            name: path.basename(filePath),
            mime: mime.getType(filePath) || 'application/octet-stream',
            size: fs.lstatSync(filePath).size,
            file: fs.readFileSync(filePath)
        };
    }

    async function upload(files, created, release, api) {
        const file = files.pop();

        if (!file) {
            return;
        }

        const fileInfo = getFile(file);

        // If not a new release, we must delete the existing one.
        if (!created && release.assets) {
            const asset = release.assets.find(a => a.name === fileInfo.name);

            // If the asset already exists, make sure we delete it first.
            if (asset) {
                var assetOptions = {
                    ...github.context.repo,
                    asset_id: asset.id
                };

                console.log(`Asset ${ fileInfo.name } already exists, it must be put in a 🕳️.`);
                console.log(`Asset Options (for delete operation) ${ assetOptions }`);

                try {
                    const result = await api.repos.deleteReleaseAsset(assetOptions);
                    console.log(`Result from delete ${ result }`);
                }
                catch (err) {
                    console.error(`⚠️ Failed to delete file ${ fileInfo.name }: ${ err }`);
                }
            }
        }

        console.log(`🚧 Uploading ${ fileInfo.name }.`);

        try {
            const result = await api.repos.uploadReleaseAsset({
                url: release.upload_url,
                headers: {
                    ['content-type']: fileInfo.mime,
                    ['content-length']: fileInfo.size
                },
                name: fileInfo.name,
                data: fileInfo.file
            });

            console.log(`Result from upload' ${ result }`);
        }
        catch (error) {
            console.error(`⚠️ Failed to upload file  ${ error }`);
        }

        // Recursive go through all files to upload as release assets.
        await upload(files, created, release, api);
    }

    try {
        const api = new github.GitHub(core.getInput('token'));
        const tag = core.getInput('tag');
        const commit = core.getInput('commitish');
        const name = core.getInput('name');
        const body = core.getInput('body');
        const draft = true;
        const prerelease = core.getInput('prerelease') == 'true';
        const files = [];

        if(core.getInput('files').indexOf(';') !== -1) {
            const fss = core.getInput('files').split(';');
            files.push(...fss)
        }
        else {
            files.push(core.getInput('files'));
        }

        let release = null;
        let created = false; // Indicate if the release was created, or merely updated.

        

        // First let us try to get the release.
        try {
            const result = await api.repos.getReleaseByTag({
                ...github.context.repo,
                tag: tag
            });

            // If this has been published, we'll create a new release.
            if (draft && !result.data.draft) {
                release = null;
                console.log(`The existing release was not draft. We can create a brand ✨ new release.`);
            }
            else {
                // We cannot update assets on existing releases, so until a future update, we'll ignore updating releases that are published.
                console.log(`Draft parameter is set to false and there is an existing release. Skipping any updates to release 🛑.`);
                return;
            }
        }
        catch (e) {
            if (e.name != 'HttpError' || e.status != 404) {
                throw e;
            }
        }

        // Define the options, these are almost same when creating new and updating existing.
        const releaseOptions = {
            ...github.context.repo,
            tag_name: tag,
            target_commitish: commit,
            name: name,
            body: body,
            prerelease: prerelease,
            draft: draft
        };

        // Create a release if it doesn't already exists.
        if (!release) {
            console.log(`Release Options (Create) ${ releaseOptions }`);
            console.log(`🌻 Creating GitHub release for tag ${ tag }.`);

            const result = await api.repos.createRelease(releaseOptions);
            release = result.data;
            //@ts-ignore
            releaseOptions.release_id = release.id
            created = true;
        }
        else {
            //@ts-ignore
            releaseOptions.release_id = release.id; // Must be part of the parameters.

            console.log(`Release Options (Update) ${ releaseOptions }`);
            console.log(`Found the 🍺. Updating GitHub release for tag ${ tag }.`);

            //@ts-ignore
            const result = await api.repos.updateRelease(releaseOptions);
            release = result.data;
        }

        // Start uploading all specified files.
        await upload(files, created, release, api);

        const updatedOptions = { ...releaseOptions , ...{ draft: false }};
        //@ts-ignore
        await api.repos.updateRelease(updatedOptions);

        console.log('All is normal 🚀. Execution has ended.')

    } catch (e) {
        console.error(`GitHub Action has failed: ${ e }`);
        core.setFailed(e.message);
    }
})();
