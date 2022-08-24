class Program {
    public static void Main(string[] args) {
        if(args.Length != 3) {
            Console.WriteLine("Missing arguments");
            Console.WriteLine("./something source target");

            return;
        }
    
        string[] LocaleFile = File.ReadAllLines(args[1]);

        List<Dictionary<string, string>> Languages = new List<Dictionary<string, string>>();

        (Dictionary<string, string> English, int CurrentLine) = LoadBase(LocaleFile);
        Languages.Add(English);

        while(CurrentLine < LocaleFile.Length - 1) {
            (Dictionary<string, string> NextLanguage, CurrentLine) = ReorderNextLanguage(LocaleFile, English, CurrentLine);
            Languages.Add(NextLanguage);
        }

        using (StreamWriter sw = new StreamWriter(args[2])) {
            for(int i = 0; i < Languages.Count; i++) {
                foreach(KeyValuePair<string, string> pair in Languages[i]) {
                    if(pair.Key == "start" || pair.Key == "end") {
                        sw.WriteLine($"{pair.Value}");
                    } else {
                        sw.WriteLine($"{pair.Key}: {pair.Value}");
                    }
                }
            }
        }
    }

    public static (Dictionary<string, string> LanguageBase, int CurrentLine) LoadBase(string[] localeFile) {
        for(int i = 0; i < localeFile.Length; i++) {
            if(localeFile[i].Contains("{")) {
                Dictionary<string, string> language = new Dictionary<string, string>();
                language.Add("start", localeFile[i]);
                
                int a = i + 1;
                bool LanguageEnd = false;
                while(!LanguageEnd) {
                    if(localeFile[a].Contains("};")) {
                        language.Add("end", localeFile[a]);
                        LanguageEnd = true;
                        continue;
                    }

                    if(!(localeFile[a].Trim() == "")) {
                        string[] line = localeFile[a].Split(": ");
                        language.Add(line[0], line[1]);
                    }

                    a++;
                }

                return (language, a);
            }
        }

        throw new Exception("No language found.");
    }
    
    public static (Dictionary<string, string> NextLanguage, int CurrentLine) ReorderNextLanguage(string[] localeFile, Dictionary<string, string> baseLanguage, int startLine) {
        for(int i = startLine; i < localeFile.Length; i++) {
            if(localeFile[i].Contains("{")) {
                Dictionary<string, string> language = new Dictionary<string, string>(baseLanguage);
                language["start"] = localeFile[i];
                
                int a = i + 1;
                bool LanguageEnd = false;
                while(!LanguageEnd) {
                    if(localeFile[a].Contains("};")) {
                        language["end"] = localeFile[a];
                        LanguageEnd = true;
                        continue;
                    }

                    if(!(localeFile[a].Trim() == "")) {
                        string[] line = localeFile[a].Split(": ");
                        language[line[0]] = line[1];
                    }

                    a++;
                }
                return (language, a);
            }
        }

        throw new Exception("No language found.");
    }
}
