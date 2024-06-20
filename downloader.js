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
