/**
 * This class is responsible for generating species and genus names
 */
class Species {

    constructor(genusName, speciesName) {
      this.genus = genusName
      this.species = speciesName
      this.name = `${genusName} ${speciesName}`
    }

    /**
     * @returns a new species within this genus
     */
    branchSpecies() {
      return new Species(this.genusName, Species.generateSpeciesName())
    }

    /**
     * @returns a new species with a new genus
     */
    static newGenus() {
      return new Species(Species.generateGenusName(), Species.generateSpeciesName())
    }

    /** 
     * @returns {string} genus name 
     */
    static generateGenusName(attempts=100) {
      if (attempts == 0) return "Failure" // throw `Failed to generate genus` // TODO just pick randomly from list
      return Species.genusGenerator.generateName(5,18,'','','','') || this.generateGenusName(attempts-1)
    }
  
    /**
     * 
     * @returns {string} species name
     */
    static generateSpeciesName(attempts=50) {
      if (attempts == 0) throw `Failed to generate species` // TODO just pick randomly from list
      return Species.speciesGenerator.generateName(5,16,'','','','') || this.generateSpeciesName(attempts-1)
    }
  
    /**
     * Nematode species names taken from dataset:
     * GBIF.org (04 April 2023) GBIF Occurrence Download  https://doi.org/10.15468/dl.dyhnwp
     */
    static genusNames = ["radopholus","quinisulcius","tylenchorhynchus","scutellonema","hoplolaimus","steinernema","neodolichodorus","achlysiella","rhabditis","ditylenchus","meloidogyne","morulaimus","dorylaimellus","metaporcelaimus","mylonchulus","paratrichodorus","panagrolaimus","ficophagus","heterorhabditis","tylenchulus","trichodorus","colbranium","carphodorus","proleptonchus","monhystera","hemicycliophora","discocriconemella","caloosia","xiphinemella","subanguina","helicotylenchus","fergusobia","trophotylenchulus","neodolichorhynchus","eutylenchus","tylodorus","tobrilus","chronogaster","filenchus","ogma","anguina","amphidelus","neopsilenchus","criconema","oscheius","alloionema","aporcelaimus","caenorhabditis","blandicephalanema","mononchus","dolichodorus","mesocriconema","falcihasta","belonolaimus","tylenchus","contortylenchus","paratylenchus","hemicriconemoides","cephalenchus","discolaimus","pratylenchus","leptonchus","xiphinema","acrobeles","sauertylenchus","paralongidorus","psilenchus","cruznema","aphelenchoides","cephalobus","nanidorus","tripius","hoplotylus","criconemoides","acrobeloides","schistonchus","rotylenchus","doryllium","clarkus","pateracephalanema","arboritynchus","crossonema","coslenchus","discolaimium","syrphonema","loofia","belondira","telotylenchus","tripyla","dorylaimoides","axonchium","croserinema","ibipora","aphelenchus","epitobrilus","mononchoides","aporcelaimellus","zygotylenchus","ironus","dorylaimus","radopholoides","stegelleta","pseudhalenchus","xenocriconemella","heterodera","prionchulus","deladenus","acontylus","eudorylaimus","trissonchulus","seinura","cobbonchus","thornenema","plectus","malenchus","miconchus","longidorus","pristionchus","anatonchus","pakira","haliplectus"]
    static speciesNames = ["neosimilis","capitatus","tobari","impar","gracilidens","trilineata","incognita","sclerus","altermacrophylla","semipenetrans","truncatum","bilineatus","vertexplanus","brevicauda","limitanea","arenaria","mobilis","nervosae","queenslandensis","novenus","minutum","octangulare","tritici","whitei","curvus","obtusum","necromenus","mutabile","halophila","simpsoni","eucalypti","simplex","iwia","saueri","hamatus","neglectus","dipsaci","magna","nudata","monohysterum","lanxifrons","seinhorsti","coronata","insignis","soldus","elongatum","incisicaudatum","pellitus","bossi","geniculatus","crenatus","australis","fisheri","minor","clariceps","longicaudum","macrophylla","colbrani","wallacei","myriophilus","bacteriophora","virdiflorae","mangiferae","sacchari","annulatus","vexillatrix","vitiensis","imbricatum","natalansis","labiata","exallus","inaequalis","charlestoni","dihystera","serratus","velatus","teres","biloculata","tesselata","cocophillus","brachyurum","lobatus","acuta","hastulatus","pectinatus","typica","hapla","brachyurus","palmatum","lolii","thornei","heptapapillatus","rotundisemenus","litoralis","civellae","macrodora","laeviflexum","coffeae","javanica","magniglans","insulare","pasticum","brasiliense","australiae","adelaidensis","taniwha","striatula","vangundyi","brevicolle","basiri","curvatum","penetrans","radicicola","orrae","similis","fluvialis","siccus","arenicolus","multicinctus","ovala"]
  
    static genusGenerator = new markov.namegen.NameGenerator(this.genusNames,1,0,false)
    static speciesGenerator = new markov.namegen.NameGenerator(this.speciesNames,1,0,false)
  
  }