class Backend {
    public static async LoadNewArticles() {
        //TODO
        console.log("Loading new articles..");
        await new Promise(r => setTimeout(r, 500));
        console.log("Loaded.");
        return [ 
                {
                    id: 0,
                    title: "Kauza kancléře Mynáře míří k nejvyššímu žalobci Střížovi. Ve hře je vrácení dotace na penzion",
                    description: "Dotační úřad ROP Střední Morava našel cestu, jak ještě získat zpět šestimilionovou dotaci na penzion v Osvětimanech od firmy Clever Management hradního kancléře Vratislava Mynáře. Vedoucí odboru veřejné kontroly Dana Koplíková serveru iROZHLAS.cz potvrdila, že úřad předal Nejvyššímu státnímu zastupitelství návrh, aby kvůli vrácení dotace podal správní žalobu k soudu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-030438780_170821-154405_kno.jpg?itok=i1w6k_n8",
                    url: "https://www.irozhlas.cz/zpravy-domov/vratislav-mynar-dotace-rop-stredni-morava-osvetimany-clever-management_2109071907_zpo"
                },
                {
                    id: 1,
                    title: "Policisté nemohli střelbě v Bělehradské ulici předejít, postupovali správně, uvedla generální inspekce",
                    description: "Útoku, při kterém koncem června zemřela pracovnice úřadu práce v Praze 2, nebylo možné předejít, uvedla na svém webu Generální inspekce bezpečnostních sborů (GIBS). Postup policie byl podle ní správný a v souladu s předpisy. Ze zastřelení zaměstnankyně úřadu práce je obviněn šestašedesátiletý muž. Podle policistů krátce předtím poleptal kyselinou ženu v Odoleně Vodě a nastražil výbušné zařízení, které zranilo policistu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-061859281_210630-142545_bar.jpg?itok=EUOjsK1J",
                    url: "https://www.irozhlas.cz/zpravy-domov/policie-postup-strelba-belehradska-urednice-gibs-inspekce_2109071724_tzr"
                },
                {
                    id: 2,
                    title: "Hamáček vysvětloval na policii plánovanou cestu do Moskvy. K obsahu výpovědi se odmítl vyjádřit",
                    description: "Vicepremiér a ministr vnitra Jan Hamáček (ČSSD) v úterý podával policistům vysvětlení k okolnostem své neuskutečněné cesty do Moskvy, kterou překazilo odhalení v kauze výbuchů ve Vrběticích. Podle informací České televize policisté dorazili za Hamáčkem dopoledne na ministerstvo vnitra. Pro média se ministr po rozhovoru s vyšetřovateli nevyjadřoval.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/rv0_6117_210628-170605_vlf.jpg?itok=nOyfuGJE",
                    url: "https://www.irozhlas.cz/zpravy-domov/jan-hamacek-cesta-do-moskvy-vrbetice-vysetrovani_2109071849_onz"
                },
            ]
    }
}
export default Backend;
