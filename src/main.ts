import { isAbsolute, join, resolve } from "node:path";
import { getBooleanInput, getInput, info, setFailed, setOutput } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

async function run(): Promise<void> {
	try {
		const path = getInput("path", { required: true });

		try {
			await getExecOutput("which", ["shopware-cli"], { silent: true });
		} catch {
			throw new Error(
				"shopware-cli is not installed. Please install it first using the official GitHub Action:\n" +
					"https://github.com/shopware/shopware-cli-action\n\n" +
					"Example:\n" +
					"- uses: shopware/shopware-cli-action@v3\n",
			);
		}

		const branch = getInput("branch");
		const outputDirectory = getInput("output-directory");
		let filename = getInput("filename");
		const gitCommit = getInput("git-commit");
		const overwriteVersion = getInput("overwrite-version");
		const overwriteAppBackendUrl = getInput("overwrite-app-backend-url");
		const overwriteAppBackendSecret = getInput("overwrite-app-backend-secret");
		const disableGit = getBooleanInput("disable-git");
		const release = getBooleanInput("release");
		const useGitTagAsVersion = getBooleanInput("use-git-tag-as-version");

		// Always pass an explicit filename so we know the exact output path.
		// shopware-cli's get-name prints the technical name on a single line.
		if (!filename) {
			const { stdout } = await getExecOutput(
				"shopware-cli",
				["extension", "get-name", path],
				{ silent: true },
			);
			filename = `${stdout.trim()}.zip`;
		}

		const args = ["extension", "zip", path];
		if (branch) {
			args.push(branch);
		}
		if (disableGit) {
			args.push("--disable-git");
		}
		if (release) {
			args.push("--release");
		}
		if (useGitTagAsVersion) {
			args.push("--use-git-tag-as-version");
		}
		if (gitCommit) {
			args.push("--git-commit", gitCommit);
		}
		args.push("--filename", filename);
		if (outputDirectory) {
			args.push("--output-directory", outputDirectory);
		}
		if (overwriteVersion) {
			args.push("--overwrite-version", overwriteVersion);
		}
		if (overwriteAppBackendUrl) {
			args.push("--overwrite-app-backend-url", overwriteAppBackendUrl);
		}
		if (overwriteAppBackendSecret) {
			args.push("--overwrite-app-backend-secret", overwriteAppBackendSecret);
		}

		const exitCode = await exec("shopware-cli", args, {
			ignoreReturnCode: true,
		});

		if (exitCode !== 0) {
			throw new Error(`shopware-cli exited with code ${exitCode}`);
		}

		// shopware-cli writes the zip into the output directory if given,
		// otherwise into the current working directory.
		const zipPath = outputDirectory
			? isAbsolute(outputDirectory)
				? join(outputDirectory, filename)
				: resolve(process.cwd(), outputDirectory, filename)
			: resolve(process.cwd(), filename);

		info(`✅ Created extension zip: ${zipPath}`);
		setOutput("zip", zipPath);
	} catch (error) {
		setFailed(`Action failed: ${(error as Error).message}`);
	}
}

run();
