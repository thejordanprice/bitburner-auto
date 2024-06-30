# Bitburner Auto Scripts

This repository contains a script that automates the downloading of files from a specified GitHub repository branch into the Bitburner game. Follow the instructions below to get started.

## Getting Started

### Prerequisites

- [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/) installed.
- Basic understanding of how to use the `nano` editor in Bitburner.
- Internet connection for fetching files from GitHub.

### Installation

1. **Copy the Script:**

    First, copy the script code below:

    ```javascript
    /** @param {NS} ns */
    export async function main(ns) {
        const repo = "thejordanprice/bitburner-auto";
        const branch = "main";
        const baseUrl = `https://raw.githubusercontent.com/${repo}/${branch}/`;
        
        const apiUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
        const filesList = await ns.wget(apiUrl, "/tmp/filesList.json");

        if (!filesList) {
            ns.print("Failed to fetch file list.");
            return;
        }

        const filesData = ns.read("/tmp/filesList.json");
        const filesJson = JSON.parse(filesData);

        for (const file of filesJson.tree) {
            if (file.type === "blob") {
                const filePath = file.path;
                const fileUrl = baseUrl + filePath;
                await ns.wget(fileUrl, filePath);
                ns.print(`Downloaded: ${filePath}`);
            }
        }
    }
    ```

2. **Open Bitburner and Use `nano` Editor:**

    In Bitburner, open a terminal and create a new file using `nano`:

    ```bash
    nano downloader.js
    ```

    Save the file and exit nano.

3. **Run the Script:**

    Run the script by typing the following command in the Bitburner terminal:

    ```bash
    run downloader.js
    ```

    The script will download all files from the specified GitHub repository and branch to your Bitburner server. It will print the file paths of the downloaded files.

4. **Check Downloaded Files:**

    You can check the downloaded files using the `ls` command in the Bitburner terminal to ensure all files are successfully downloaded.

    ```bash
    ls
    ```

## Running `hack-manager.js`

After downloading the repository, you may want to start the `hack-manager.js` script. This script helps you to find and hack the optimal server from all available servers, except your home server.

### Instructions to Use `hack-manager.js`

1. **Copy the `hack-manager.js` Script:**

    Make sure you have the `hack-manager.js` script from the repository:

    ```javascript
    // hack-manager.js

    /**
     * Finds the optimal server to hack and hacks it from all possible servers except home.
     * !! Only run from home server !!
     * @param {NS} ns
     **/
    export async function main(ns) {
        while (true) {
            const allServers = await findAllServers(ns);  // Finds all servers and clones grow, hack, and weaken files to them.
            const [hackableServers, rootableServers, optimalServer] = await findHackable(ns, allServers); // Finds and nukes optimal, hackable, and rootable servers.

            const target = optimalServer;
            const moneyThresh = ns.getServerMaxMoney(target) * 0.90; // 90% threshold for money.
            const securityThresh = ns.getServerMinSecurityLevel(target) + 5; // Security threshold.

            const numTimesToHack = 2.05; // Number of times to hack/grow/weaken in a row.
            const sleepTime = numTimesToHack * 300; // Sleep time adjustment.

            // Main hacking loop, runs actions based on server state.
            if (ns.getServerSecurityLevel(target) > securityThresh) {
                await performAction(ns, rootableServers, "w1.js", target, securityThresh, numTimesToHack, 'weaken', ns.getWeakenTime(target) + sleepTime);
            } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
                await performAction(ns, rootableServers, "g1.js", target, securityThresh, numTimesToHack, 'grow', ns.getGrowTime(target) + sleepTime);
            } else {
                await performAction(ns, rootableServers, "h1.js", target, securityThresh, numTimesToHack, 'hack', ns.getHackTime(target) + sleepTime);
            }
        }
    }

    // Helper functions...
    ```

2. **Run the `hack-manager.js` Script:**

    Execute the script by running:

    ```bash
    run hack-manager.js
    ```

    Ensure you run this script from your home server only. The script will automatically find and hack the optimal server from all available servers, except your home server.

3. **Monitor the Hacking Process:**

    The script will continuously monitor the optimal server and perform the necessary actions (weaken, grow, hack) based on the server's current state. It will also display relevant information about the server's status in the terminal.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
