/** @param {NS} ns */
export async function main(ns) {
    let files = ns.ls(ns.getHostname());
    
    for (let file of files) {
        try {
            ns.print(`Deleting file: ${file}`);
            ns.rm(file);
        } catch (e) {
            ns.print(`Error deleting file ${file}: ${e}`);
        }
    }
    
    ns.print("All files deleted.");
}
