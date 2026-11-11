# Tutorials, the ebook and the user forum

Four resources written and run by the dartR developers. Use them in three ways.

- **Send the user to a page** when they need an explanation or a complete worked analysis, not only a code fix. Give the specific chapter or tutorial, not the home page.
- **Read the page yourself**, if you have web access, before writing a kind of analysis you have not written before. The table below maps analyses to pages.
- **Send the user to the forum** when the problem looks like a bug in a function, or when you have checked the signature and the versions and still cannot resolve it.

## Their code is not always current

Each page was written for the release current at the time. On 10 November 2026 every dartR call in these pages was checked against the 1.2.6 signatures: 799 calls, 50 mismatches (a function that is not exported, or an argument that does not exist). The mismatches are listed under each resource. So take the workflow and the reasoning from a tutorial, and check each call against the function reference (`index.md`, or `scripts/dartr_ref.R help <function>`) before you reuse it.

| Resource | dartR calls checked | Mismatches with 1.2.6 |
|---|---|---|
| Ebook | 79 | 7 |
| 2026 workshop (`kioloa2`) | 390 | 4 |
| 2024 workshop (`kioloa`) | 330 | 39, of which 30 are the arguments of one `gl2colony()` call |

Seven code fragments in the ebook could not be parsed and were not checked.

## Which page for which task

Prefer the ebook and the 2026 workshop. The 2024 workshop is listed where it covers something the others do not.

| Task | Page |
|---|---|
| R and RStudio basics | Ebook chapters 1 and 2 |
| Read DArT, SilicoDArT or VCF data; export to other programs | Ebook chapter 3; W02 |
| From raw reads or a VCF to a filtered genlight | W05 |
| Inspect, subset, recode and rename individuals and populations | Ebook chapter 4 |
| Which filters, in what order, with what thresholds | Ebook chapter 5; W02 |
| PCA and PCoA, and what a PCA can mislead about | Ebook chapter 6; W08; W09 for customising and saving the plot |
| Sex-linked loci | W03 |
| STRUCTURE, fastStructure, sNMF, PopCluster | W04 |
| Small populations: diversity, choosing individuals | W06 |
| Effective population size, recent and historical | W07 |
| Divergence, FST, private alleles, allelic richness | W08 |
| Distance phylogenetics (`gl.dist.phylo`, `gl.tree.nj`, `gl.tree.fitch`) | 2024 session 9 |
| Colours, smear plots, BLAST, genome positions, SNP density, LD plots | W09 |
| Selection and adaptation: RDA | W10; 2024 session 7 adds GWAS and random forest |
| Landscape genetics: isolation by distance, least-cost paths, EEMS | W11; 2024 session 8 |
| Simulations | W14 |
| Designing a SNP panel | W15 |
| Relatedness, kinship, parentage | W16 |
| Fixed differences, chromosomal inversions, combining datasets | 2024 session 13 |
| Reproducible reports with Quarto | 2024 session 4 |

## 1. Ebook: Getting started with dartRverse

<https://canberra.pressbooks.pub/dartrverse/> (DOI 10.26191/xrkg-6996). University of Canberra, licence CC BY-NC 4.0: link to it and summarise it with attribution; do not paste long passages into a user's document. It assumes no programming experience.

| Chapter | Covers | URL ending |
|---|---|---|
| 1 RStudio Refresher | RStudio, projects, installing packages | `chapter/chapter-1-rstudiorefresher/` |
| 2 A Primer on R Programming | Data structures, input and output, control flow, functions | `chapter/chapter-2-a-primer-on-r-programming/` |
| 3 Data Input and Structures | What DArTseq produces; `gl.read.dart`, `gl.read.silicodart`, `gl.read.vcf`; `gl.save`, `gl.load`; the `gl2*` exporters | `chapter/chapter-3-datainputandstructures/` |
| 4 Data Manipulation | Interrogating a genlight; dropping, keeping, recoding, merging and renaming; recalculating metrics | `chapter/chapter-4-data-manipulation/` |
| 5 Filtering | Each report and filter pair; how DArT filters before you receive the data; filtering order and thresholds | `chapter/chapter-5-filtering/` |
| 6 Exploratory Visualisation with PCA | What PCA does and how to read it | `chapter/chapter-6-exploratory-visualisation-with-pca/` |
| Integrative Exercises | Practice across the chapters | `chapter/integrative-exercises/` |

**What chapter 5 says about filtering order.** There is no single correct order: it depends on whether keeping loci or keeping individuals matters more. Usually individuals are the scarcer resource, so loci are filtered on call rate before individuals. The chapter offers this as a starting point, to be adjusted to the data and to the analysis that follows:

1. sex-linked loci (`gl.filter.sexlinked`);
2. read depth, if DArT's own threshold is too lenient (`gl.filter.rdepth`);
3. reproducibility, say 0.98 (`gl.filter.reproducibility`);
4. call rate by locus, say 0.95;
5. call rate by individual, say 0.80;
6. secondaries, keeping one SNP per sequence tag (`gl.filter.secondaries`);
7. monomorphic loci created by removing individuals (`gl.filter.monomorphs`).

Its advice on thresholds is not to over-filter: start strict, see what the final analysis does, then relax to the lightest filtering that still gives a stable result.

**Calls that do not match 1.2.6.** Chapter 4: `gl.subsample.pop()`, `gl.make.recode.loc()` and `gl.recode.loc()` are not exported, and `gl.subsample.ind()` and `gl.subsample.loci()` have no `replacement` argument. Chapter 5: `gl.report.reproducibility()` has no `plot` argument and `gl.filter.rdepth()` has no `threshold` argument (it takes `lower` and `upper`).

## 2. 2026 workshop: Analysing Genomic Data with dartRverse

<https://green-striped-gecko.github.io/kioloa2/>. Each tutorial is at `inst/tutorials/Wnn/Wnn.html` under that address, for example <https://green-striped-gecko.github.io/kioloa2/inst/tutorials/W04/W04.html>.

| Tutorial | Covers | Main dartR functions |
|---|---|---|
| W02 dartR Intro | Reading a DArT report, report and filter pairs, sex-linked filtering | `gl.read.dart`, `gl.report.callrate`, `gl.filter.callrate`, `gl.report.sexlinked`, `gl.smearplot` |
| W03 Sex-Linked Markers | Finding sex-linked loci, what happens if they stay in, inferring sex | `gl.report.sexlinked`, `gl.keep.sexlinked`, `gl.infer.sex`, `gl.fst.pop` |
| W04 Genetic Structure | STRUCTURE, fastStructure, sNMF, PopCluster, choosing K, mapping ancestry | `gl.run.structure`, `gl.run.faststructure`, `gl.run.snmf`, `gl.run.popcluster`, `gl.evanno`, `gl.plot.*`, `gl.map.*` |
| W05 Calling SNPs | Study design, Galaxy Australia, STACKS, a stepwise VCF filtering pipeline | `gl.compliance.check`, `gl.recalc.metrics`, `gl.reassign.pop`, `gl.dist.ind` |
| W06 Small Populations | Managing small populations, choosing individuals to keep diversity | `gl.opt.ind.all`, `gl.sfs`, `gl.filter.maf` |
| W07 Effective Population Size | Recent Ne from linkage disequilibrium; historical Ne from the site frequency spectrum | `gl.LDNe`, `gl.sfs`, `gl.run.epos`, `gl.download.binary`, `gl.sim.Neconst` |
| W08 Genetic Structure of Wild Populations | Divergence, the "seven sins" of PCA, two worked examples | `gl.report.fstat`, `gl.report.heterozygosity`, `gl.report.pa`, `gl.report.allelerich`, `gl.impute`, `gl.pcoa` |
| W09 Hidden dartR Powers | Colours, PCoA plots, clustering, BLAST, chromosome and position slots, SNP density, LD | `gl.colors`, `gl.pcoa.plot`, `gl.blast`, `gl.find.genes.for.loci`, `gl.plot.snp.density`, `gl.report.ld.map`, `gl.ld.haplotype` |
| W10 Natural Selection & Adaptation | Partial RDA for genotype-environment association | `gl2gi`; the analysis itself uses other packages |
| W11 Landscape Genetics | Isolation by distance and resistance | `gl.ibd` |
| W14 Simulations | Drift, divergence, demography, SNP panel performance through time | `gl.sim.ind`, `gl.sim.Neconst`, `gl.sim.offspring`, `gl.select.panel`, `gl.check.panel` |
| W15 SNP that Matter | Designing and testing a SNP panel | `gl.select.panel`, `gl.check.panel` |
| W16 Relatedness | Relatedness estimators, COLONY, diagnostics | `gl.diagnostics.relatedness`, `gl.run.colony`, `gl.filter.excess.het` |

W01, W12, W13 and W17 are talks or demonstrations with no dartR code (W12 is on using AI in population genetics). The site also holds a copy of the ebook's worked examples and exercises (`inst/tutorials/getting-started/getting-started.html`); prefer the ebook itself.

**Calls that do not match 1.2.6.** W06: `gl.subsample.ind2()` is not exported and `gl.opt.ind.all()` has no `plot` argument. W14: `gl.sim.offsprings()` is not exported (`gl.sim.offspring()` is). W16: `gl.diagnostics.relatedness()` has no `runE9` argument.

**The install page** (`install.html`) says that `install.packages("dartRverse")` also installs dartR.base and dartR.data. It does not; on that page they arrive only as dependencies of the add-on packages installed further down. The page also installs SNPRelate from Bioconductor but not snpStats, which dartR.base needs as well. Use the Setup section of `SKILL.md` and `traps.md`, section 9, for install commands.

## 3. 2024 workshop: Kioloa PopGen

<https://green-striped-gecko.github.io/kioloa/>. Sessions are at `session01.html` to `session13.html`. Older code: check every call.

| Session | Covers |
|---|---|
| 1 Intro to dartR | Fundamentals, filtering strategies |
| 2 Pop Gen In Conservation | Structure and demographic history of populations |
| 3 Sequencing Technologies | How call rate and sampling change heterozygosity estimates |
| 4 Data Management, Reproducibility & Integrity | Reproducible research with Quarto |
| 5 Effective Population Size | Recent and historical Ne |
| 6 Management of Small Populations | Allelic richness, heterozygosity, FST |
| 7 Natural Selection | RDA, GWAS, random forest |
| 8 Landscape Genetics | Dispersal, isolation by distance, EEMS, isolation by resistance |
| 9 Lineage Divergence | Distance phylogenetics from SNPs |
| 10 Sex Linked Markers | ZW and XY examples |
| 11 Relatedness & Kinship | GRM, networks, COLONY |
| 12 Genetic Structure | Distances, STRUCTURE, fastStructure |
| 13 Combining Genomic Resources | Gene flow between karyotypes, a chromosomal inversion |

**Calls that do not match 1.2.6.**

- Session 1: `gl.report.overhang()` and `gl.filter.overhang()` are not exported.
- Session 2: `gl.percent.freq()` exists only in the old `dartR`.
- Session 5: `gl.epos()` is now `gl.run.epos()`.
- Session 10: written for an earlier dartR.sexlinked. `gl.filter.sexlinked()` now takes the genlight as `x`, not `gl`, and has no `plots` argument; the first argument of `gl.infer.sex()` is `gl_sexlinked`, not `gl_sex_filtered`; `gl.report.diversity()` has no `pbar` argument.
- Session 11: 30 arguments of `gl2colony()` have been renamed, mostly from underscores to dots (`probability_father` is now `probability.father`), and `gl.grm.network_2()` is a helper file of the workshop, not a package function.

## 4. The dartR Google Group

<https://groups.google.com/g/dartr>. The question-and-answer forum for dartR users; nearly every function's help page (275 of 296) names it as the place to post, and the developers answer there. It is public and searchable.

**When to send the user there:** a function errors or returns something wrong after the call has been checked against the reference and the packages are up to date; a function lacks something they need; or the question is about method or interpretation and the help page and tutorials do not settle it.

**Before posting**, the forum asks that the user has:

1. searched the forum for the same question;
2. read the relevant tutorial and the function's help page;
3. updated R and the packages, then restarted;
4. run `gl.compliance.check()` on the genlight object.

**What a post must contain**, in the forum's own terms, is a minimal reproducible example:

- a minimal dataset that shows the problem, preferably one bundled with dartR (`platypus.gl`, `bandicoot.gl`, `possums.gl`, `testset.gl`; `testset.gs` for presence/absence data);
- the shortest code that reproduces it on that dataset;
- the output of `sessionInfo()`.

Offer to draft the post. Reproduce the problem on a bundled dataset if you can: that often shows whether the fault lies in the function or in the user's data, and it keeps unpublished data, such as locations of threatened species, off a public forum. Add the full error message and the `dartRverse_install()` version table.
