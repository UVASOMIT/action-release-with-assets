require('child_process')
    .execSync(
        'npm install @actions/core @actions/github conventional-changelog-cli',
        { cwd: __dirname }
    );  
const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    try {
        const api = new github.GitHub(core.getInput('token'));
        const tag = core.getInput('tag');
        const name = core.getInput('name');
        const body = core.getInput('body');
        const draft = core.getInput('draft') == 'true';
        const prerelease = core.getInput('prerelease') == 'true';
        const files = core.getInput('files').split(' ').map(asset => asset.split(':'));

        let release = null;

        // First let us try to get the release.
        try {
            release = await api.repos.getReleaseByTag({
                ...github.context.repo,
                tag: tag
            });

            console.log('The tag exists.');
        }
        catch (error) {
            if (error.name != 'HttpError' || error.status != 404) {
                throw error;
            }
        }

        // Create a release if it doesn't already exists.
        if (!release) {

            console.log('The tag did not exists, creating a new release.');

            release = await api.repos.createRelease({
                ...github.context.repo,
                tag_name: tag,
                target_commitish: github.context.sha,
                name,
                body,
                prerelease: prerelease,
                draft: draft
            });
        }

        // Go through all the specified files and upload to the release.
        for (const [source, target, type] of files) {

            console.log('FILE:');
            console.log(source);
            console.log(target);
            console.log(type);

            const data = fs.readFileSync(source);

            console.log(data);

            api.repos.uploadReleaseAsset({
                url: release.data.upload_url,
                headers: {
                    ['content-type']: 'raw',
                    ['content-length']: data.length
                },
                name: target,
                file: data
            });
        }
    } catch (error) {
        console.error(error);
        core.setFailed(error.message);
    }

})();