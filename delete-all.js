/** @param {NS} ns */
export async function main(ns) {
    let files = ns.ls(ns.getHostname());
    
    for (let file of files) {
        if (file.endsWith('.exe')) {
            ns.print(`Skipping .exe file: ${file}`);
            continue;
        }
        
        try {
            ns.print(`Deleting file: ${file}`);
            ns.rm(file);
        } catch (e) {
            ns.print(`Error deleting file ${file}: ${e}`);
        }
    }
    
    ns.print("Non-.exe files deleted.");
}
