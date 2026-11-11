# dartRverse traps, by topic

Calls that run without an error and give a wrong or misleading result, plus a few that fail in ways that are hard to diagnose. Read the section for the analysis you are writing.

Each item carries its evidence:

- **[tested 1.2.6]** reproduced on dartR.base / dartR.* 1.2.6 with the data bundled in dartR.data.
- **[tested 1.2.3]** reproduced on the CRAN release dartR.base 1.2.3.
- **[source of ...]** read from the function's source code in that version, not run. Installing was never run for this file, because it would change the machine's R library.
- **[help]** stated in the function's own help page in 1.2.6.
- **[NEWS of dev]** described in the change log (`NEWS.md`) on the `dev` branch of that package, read on 11 November 2026.
- **[developer note]** recorded by the dartR developers while analysing real datasets; not re-tested for this file.

## Contents

1. Individuals, populations and metadata
2. Reading data
3. Reports, plots and verbosity
4. Filtering and imputation
5. Statistics that are not what the name suggests
6. Genome positions
7. Relatedness and kinship
8. Programs outside R
9. Installing, updating and version differences
10. File-backed objects

## 1. Individuals, populations and metadata

- **`gl.keep.ind()` keeps the object's order, not the order of `ind.list`.** Asking for `c("SUS20", "SDS12", "T27")` returns `T27, SDS12, SUS20` if that is how they sit in the object. Assigning `pop(g) <- labels` by position afterwards scrambles the labels; in one real analysis this collapsed regional FST to about zero. Assign by name: `pop(g) <- labels[match(indNames(g), ids)]`. **[tested 1.2.6]**
- **Join a sample sheet by name.** `x@other$ind.metrics` is in the object's order, which is the order of the DArT report, not of the user's spreadsheet. DArT sample names can be the lab's target IDs rather than the user's field IDs, so check that the names match before joining. **[developer note]**
- **`x[i, j]` keeps `ind.metrics`, `loc.metrics` and `latlon` in step with the genotypes**, so it is safe for subsetting. It does not recalculate locus statistics. **[tested 1.2.6]**
- **Subsetting leaves monomorphic loci and stale `loc.metrics`.** `gl.keep.pop()`, `gl.drop.pop()`, `gl.keep.ind()`, `gl.drop.ind()` and the call-rate filter by individual default to `recalc = FALSE, mono.rm = FALSE`. Keeping one population of `platypus.gl` leaves 513 of 1,000 loci monomorphic or entirely missing and `CallRate` as it was for all 81 individuals. Pass `recalc = TRUE, mono.rm = TRUE`, or call `gl.recalc.metrics()` and `gl.filter.monomorphs()` afterwards. **[tested 1.2.6]**
- **`rbind()` on two genlights stacks them by locus position, not by locus name.** If the two objects hold the same loci in a different order, genotypes land under the wrong loci. Check `identical(locNames(a), locNames(b))` first, or reorder one to match. **[developer note]**
- **`gl.join()` needs the same individuals (to add loci) or the same loci (to add individuals).** **[help]** Two datasets genotyped or called separately can disagree on which allele is the reference at a shared locus (about 10% of shared loci in one case), which silently inverts genotypes on merging. Compare allele labels before joining. **[developer note]**
- **Rename populations before a structure analysis, not after.** `gl.plot.snmf()` and `gl.plot.popcluster()` match population labels between the result and the genlight by name; renaming `pop(x)` afterwards drops the renamed populations from the legend. **[developer note]**
- **Give individuals and populations plain, unique names:** letters, digits, `_` and `.`, with no spaces and no accented characters. Names are written to text files on their way to PopCluster, EMIBD9, COLONY and other programs, and failures in those programs have been traced back to a space or an accent in a name. Rename at the start of the script, before anything is computed from the names. **[developer note]**

## 2. Reading data

- **`gl.read.dart()` drops samples that have no row in `ind.metafile`.** With 10 of 250 rows removed from the example metadata, it returns 240 individuals and raises no error. Give every sample a row, then compare `nInd(x)` with the number expected. **[tested 1.2.6]**
- **The metadata file needs an `id` column that matches the sample names in the data file exactly** (case and spaces included). `pop`, `lat` and `lon` are recognised and fill `pop(x)` and `x@other$latlon`; other columns are kept in `ind.metrics`. Without a metadata file all individuals fall into one population. **[tested 1.2.6]**
- **`gl.read.vcf()` also takes `ind.metafile`.** Use it rather than adding populations by hand afterwards. **[help]**
- **`gl.read.dart()` keeps each sample's DArT order and plate position.** They are in `x@other$ind.metrics$service` (the order number, `DPla19-4171` in `platypus.gl`) and `x@other$ind.metrics$plate_location` (plate and well, `2-A10`). **[tested 1.2.6]** When a dataset combines several orders, colour a PCoA by `service` before interpreting it: groups that follow the order and not the sampling sites are a batch effect. `gl.report.contamination()` reads the same two columns to test whether suspect samples sat in adjacent wells. **[developer note; help]**
- **On the CRAN release, `gl.read.csv()`, `gl.read.PLINK()` and `gl.read.fasta()` return an object with no genotypes** at the default verbosity. See section 9, "Differences that change results". **[tested 1.2.3]**
- **Save and reload with `gl.save()` and `gl.load()`.** They wrap `saveRDS()` / `readRDS()`; `gl.load()` can also run the compliance check. An object built or edited by hand should go through `gl.compliance.check()` before other functions use it. **[help]**

## 3. Reports, plots and verbosity

- **`verbose = 0` turns off plots.** With `plot.display = TRUE` left at its default, `gl.report.callrate`, `gl.report.heterozygosity`, `gl.report.maf`, `gl.filter.callrate`, `gl.report.rdepth`, `gl.dist.pop`, `gl.report.fstat`, `gl.report.sexlinked` and `gl.filter.sexlinked` each drew a plot at `verbose = 1` or higher and none at `verbose = 0`. `gl.set.verbosity(0)` has the same effect on every later call. Use `verbose = 1` to keep the figure with almost no text. **[tested 1.2.6]**
- **`plot.file` saves an `.RDS` file, not an image.** The file holds the ggplot (or patchwork) object and is written to `plot.dir`, or to the working directory when `plot.dir` is not given. To get a picture: `p <- readRDS(file.path(dir, "name.RDS")); ggplot2::ggsave("name.png", p, width = 7, height = 5)`. **[tested 1.2.6]**
- **Report functions return different things.** Check **Returns** before assigning. Tested on 1.2.6: **[tested 1.2.6]**

  | Returns | Functions |
  |---|---|
  | The genlight, unchanged | `gl.report.callrate`, `gl.report.monomorphs`, `gl.report.rdepth`, `gl.report.reproducibility`, `gl.report.overshoot`, `gl.report.bases` |
  | A data frame | `gl.report.heterozygosity`, `gl.report.maf`, `gl.report.secondaries`, `gl.report.hwe`, `gl.report.pa`, `gl.report.hamming`, `gl.report.ld.map` |
  | A list | `gl.report.fstat`, `gl.report.diversity`, `gl.report.replicates` |
  | `NULL` | `gl.report.basics` |

- **Plot argument names are not uniform.** Most functions use `plot.display`, `plot.theme`, `plot.colors`; some still use `plot.out`, `plot_theme` or `plot_colors` (for example `gl.pcoa`, `gl.report.replicates`, `gl.LDNe`). The full list is in `migration-from-dartR.md`, section 2. **[tested 1.2.6]**
- **`gl.report.replicates()` lists only the pairs above its threshold**, not every pair compared. An empty table means no pair passed, not that nothing was compared. **[developer note]**

## 4. Filtering and imputation

- **`gl.filter.maf()` treats a threshold above 1 as a minor allele count.** It converts the count to a frequency as `threshold / (nInd * ploidy)`, using all individuals, so with missing data it is not exactly "at least 3 copies observed": on `platypus.gl`, `threshold = 3` kept 554 loci where 550 have three or more copies of the minor allele. Report it as the function defines it. A count is often the better choice when groups differ in size. **[tested 1.2.6]**
- **Filter loci on call rate before individuals.** Individual call rate is measured against the loci still in the object. On one dataset, requiring 0.90 per individual on the raw 44,000 loci dropped 191 of 272 samples; the same samples passed once poor loci had been removed. **[developer note]**
- **`gl.filter.hwe()` tests within each population by default (`subset = "each"`).** `subset = "all"` pools the populations, and the help page notes the test is only valid without substructure. Populations of fewer than about 15 individuals have little power. **[help]**
- **`gl.filter.secondaries(method = "random")` picks one SNP per sequence tag at random**, so the retained loci change between runs unless the seed is set. **[help]**
- **Screen for contamination before removing replicates.** From each pair of replicates, `gl.filter.replicates()` removes the sample with more missing data. **[help]** A sample that carries a second individual's DNA is usually the one with less missing data, so the filter tends to keep the contaminated sample and discard the clean one. Run `gl.report.contamination()` and `gl.filter.contamination()` first. Both are in dartR.base 1.2.6 and not in the CRAN release. **[developer note]**
- **`gl.impute()` works population by population.** The same data imputed under two different `pop(x)` assignments gives different genotypes. If `pop` is the grouping you then show in a PCoA, imputation pulls each group towards its own allele frequencies and the groups look more distinct than the data support. Impute on a neutral grouping such as locality and use the grouping of interest only to colour the plot. **[tested 1.2.6; consequence from a developer note]**
- **`gl.impute()` leaves loci that are missing in every individual as `NA`**, even with `fill.residual = TRUE`: 486 missing values remained on `platypus.gl`, from 6 such loci. Run `gl.filter.allna()` first and check `sum(is.na(as.matrix(x)))` afterwards. **[tested 1.2.6]**
- **`method = "neighbour"` (the default) can exhaust memory.** Its distance step used more than 64 GB on an object of only 307 individuals by 300 loci in one case. `method = "frequency"` is the safer first choice for preparing data for LD work. **[developer note]**
- **Sex-linked loci.** `gl.drop.sexlinked()` is deprecated; use `gl.filter.sexlinked()`. Both it and `gl.report.sexlinked()` need `system = "xy"` or `"zw"`, and a `sex` column in `ind.metrics` coded `F` / `M` (or `Female` / `Male`); anything else is treated as unknown. A wrong `system` gives a plausible but wrong classification. **[tested 1.2.6; help]**

## 5. Statistics that are not what the name suggests

- **FST.** `gl.fst.pop()` estimates Weir and Cockerham's (1984) theta. `gl.report.fstat()` reports Nei's (1987) Fst and Fstp, Jost's D and Hedrick's Gst_H. The two families differ, sometimes substantially, when sample sizes are uneven. Name the estimator in the text. **[help]**
- **`gl.fst.pop()` return value.** With `nboots = 1` (default) it is a matrix with values in the lower triangle and `NA` elsewhere, with populations in order of first appearance, not factor-level order. With `nboots > 1` it is a list with `Fsts`, `Pvalues` and `Bootstraps`. Use `as.matrix(as.dist(fst))` for a symmetric matrix. **[tested 1.2.6]**
- **`gl.report.heterozygosity()` columns.** `n.Ind` is the mean number of individuals with a genotype per locus, so 114.8 for a population of 116 is not a missing individual. `FIS` is the mean of per-locus values, so it will not equal `1 - Ho / uHe` computed from the tabulated means when diversity is low. **[developer note]**
- **Genome-wide heterozygosity needs the invariant sites.** Heterozygosity from SNPs alone is inflated relative to the genome. `gl.report.heterozygosity(n.invariant = )` adjusts for it; the count comes from `gl.report.secondaries()`. **[help]**
- **The site frequency spectrum and Tajima's D.** Do not apply a MAF filter first: it removes the rare alleles these statistics are built from. In clonal organisms remove clones (`gl.report.replicates()`) before SFS work. **[developer note]**
- **`gl.report.ld.map()` and related LD reports** compute r² from haplotype frequencies estimated by EM. NeEstimator (behind `gl.LDNe()`) and PLINK `--r2` use the composite genotypic r² (squared correlation of allele dosages). The two agree only under Hardy-Weinberg proportions; they correlated 0.68 on one small sample. To reproduce NeEstimator's values in R use `cor(as.matrix(x), use = "pairwise.complete.obs")^2`. **[developer note]**
- **`gl.pcoa()` loadings.** Row names of `$loadings` are `locus.allele` (for example `45055704-36-G/A.G/A`), and monomorphic loci are dropped by default (`mono.rm = TRUE`), so the rows neither match nor line up with `locNames(x)`. Strip the suffix and match by name. **[tested 1.2.6]**
- **`gl.dist.ind()`** defaults to Euclidean distance for SNP data and simple matching for presence/absence data. Jaccard, Bray-Curtis and Sorensen are for presence/absence data only. **[help; developer note]**

## 6. Genome positions

- **After `gl.read.dart()`, `x@position` is the SNP's position within its sequence tag (`loc.metrics$SnpPosition`) and `x@chromosome` is empty.** Chromosome and base-pair position are in `loc.metrics` columns whose names include the reference genome, such as `Chrom_Platypus_Chrom_NCBIv1` and `ChromPos_Platypus_Chrom_NCBIv1`. Functions that use map positions read the slots, so set them first: **[tested 1.2.6]**

  ```r
  chromosome(x) <- as.factor(x@other$loc.metrics$Chrom_Platypus_Chrom_NCBIv1)
  position(x)   <- as.integer(x@other$loc.metrics$ChromPos_Platypus_Chrom_NCBIv1)
  ```

  Loci that did not align have a blank chromosome; decide whether to drop them before analyses that need a map.
- **The column name states which genome DArT aligned the tags to.** `Chrom_Platypus_Chrom_NCBIv1` means that assembly, so it is the one to cite in the methods and the one to use when looking positions up. Another assembly of the same species has different coordinates. Of the datasets bundled in dartR.data only `platypus.gl` has these columns; an object without them carries no alignment. **[tested 1.2.6; developer note]**
- **`gl.blast()` followed by `gl.find.genes.for.loci()` needs the same hand-off.** `gl.blast()` writes the best hit to `loc.metrics` (`sacc`, `sstart`); copy them into the slots as above before looking up genes. **[developer note]**
- **`gl.LDNe(pairing = "separate")` uses the chromosome slot.** Keep chromosome names short and free of spaces: NeEstimator reads only the first characters of each name, and long names such as `HiC_scaffold_1` have crashed it or merged chromosomes in releases before the fix. Recoding to integers avoids it: `chromosome(x) <- as.factor(as.integer(chromosome(x)))`. **[developer note]**

## 7. Relatedness and kinship

- **Kinship is half of relatedness.** Full siblings have relatedness 0.5 and kinship 0.25; an individual with itself has relatedness 1 and kinship 0.5 (more if inbred). Check which scale a function returns before applying a threshold. **[developer note]**
- **`gl.run.EMIBD9()$rel` is on the kinship scale** (the diagonal is `0.5 * (1 + F)`). **[help]** Its rows and columns have come back in alphabetical order rather than the object's order; index it by name, and never overwrite its `dimnames` with `indNames(x)`. **[developer note]**
- **`gl.grm()` is in dartR.captive, not dartR.base.** `dartR.spatial::gl.grm2()` is the equivalent when dartR.captive is not installed. **[tested 1.2.6]**
- **A genomic relationship matrix computed across structured populations inflates within-group values**, because divergence between groups is read as relatedness within them. Compute it within each group with that group's allele frequencies. **[developer note]**
- **`gl.grm.network(categorise = TRUE)` uses fixed kinship classes** (0.1, 0.2, 0.3). In inbred populations full siblings can exceed the top class and be drawn as the same individual. **[developer note]**
- **`gl.grm.network()` works on kinship, and whether it halves its input depends on the version.**
  - *dartR.captive 1.2.6.* The matrix is taken as relatedness and halved, unless it carries `attr(G, "scale") = "kinship"`. `gl.grm()` and `gl.relatedness()` tag their matrices `"relatedness"` and `gl.run.EMIBD9()$rel` is tagged `"kinship"`, so pass each one as it comes. Do not halve by hand: `G / 2` keeps the `"relatedness"` tag and is halved a second time. Subsetting drops the tag, so `K[ids, ids]` of a kinship matrix is halved by mistake: on 25 platypus the largest kinship came back as 0.072 instead of 0.144. After subsetting or reordering a kinship matrix, restore the tag with `attr(K, "scale") <- "kinship"`. **[tested 1.2.6]**
  - *dartR.captive 1.2.2 (CRAN), with the default `standardise = FALSE`.* The values are used as they are. Halve a relatedness matrix from `gl.grm()` first; otherwise full siblings, with relatedness 0.5, are drawn in the "same individual" class, which starts at 0.3. **[source of 1.2.2]**

  A script that is right on one version is therefore wrong by a factor of two on the other. Check `packageVersion("dartR.captive")` before writing the call.

## 8. Programs outside R

Many functions run a separate program. `dartRverse::gl.download.binary()` fetches most of them from the dartRverse repository, where they can also be browsed: <https://github.com/green-striped-gecko/dartRverse/tree/dev/binaries>. The programs are other people's work, redistributed with their permission: cite the program, using the reference in the wrapper function's help page.

### Getting a program

```r
bin <- path.expand("~/dartr-binaries")                 # a folder that outlives the R session
gl.download.binary()                                    # table of programs available for each operating system
p <- gl.download.binary("neestimator", out.dir = bin)   # downloads, unzips, returns the folder: bin/neestimator
ne <- gl.LDNe(x, neest.path = p)                        # folder arguments take that path as it is
```

- **Give `out.dir`.** It defaults to `tempdir()`, which R deletes when the session ends, so a script that relies on the default downloads the program again every time. `out.dir` is created if it does not exist. **[tested 1.2.7]**
- **The function returns the folder `out.dir/<software>`, invisibly.** Keep it in a variable; it is already an absolute path if `out.dir` was. One program per call. **[tested 1.2.7]**
- **Some arguments want the folder, others the executable file.** See the table. For a file argument, add the file name: `exec = file.path(p, "structure")`, or `"structure.exe"` on Windows. **[help of each function]**
- **`branch` defaults to `"main"`; two programs need `branch = "dev"` today.** BayeScan exists only on `dev`. And on `main` the Mac archive of NeEstimator unpacks its executable straight into `out.dir`, so the folder the function returns does not exist; the `dev` archive is correct. Check with `dir.exists(p)`. **[tested 2026-11-10]**
- **Not every program exists for every system.** fastStructure has no Windows build. `os = "linux"` downloads the Linux build from another system, for example to prepare a cluster run. **[tested 1.2.7]**
- **Mac builds are a mix of processor types.** STRUCTURE, NeEstimator, COLONY, PLINK, PopCluster, fastStructure and GONE are Intel builds, so an Apple Silicon Mac runs them through Rosetta 2, which must be installed. EEMS, EMIBD9, EPOS and ms are Apple Silicon builds and will not run on an Intel Mac. BayeScan runs on both. A `Bad CPU type in executable` error means this. **[main executable of each program checked 2026-11-10]**
- **dartRverse 1.0.6 does not make the files executable on Mac or Linux.** Version 1.2.7 does. On 1.0.6 a wrapper fails with `Permission denied` until you run `Sys.chmod(list.files(p, full.names = TRUE, recursive = TRUE), "0755")`. **[source of 1.0.6; the same unzip step left mode 644 here]**
- **Beagle and Stairway Plot 2 are Java programs**, so Java must be installed as well. **[contents of the archives]**

### Which program goes with which function

| `software` | Functions | Argument | Give it |
|---|---|---|---|
| `structure` | `gl.run.structure` | `exec` | the executable file |
| `faststructure` | `gl.run.faststructure` | `exec`; `exec.plink` | the `fastStructure` file; the folder holding PLINK |
| `popcluster` | `gl.run.popcluster` | `popcluster.path` | the folder |
| `neestimator` | `gl.LDNe`, `gl.check.panel`, `gl.select.panel.combined`, `gl.diagnostics.relatedness` | `neest.path` | the folder |
| `epos` | `gl.run.epos` | `epos.path` | the folder |
| `stairway2` | `gl.run.stairway2` | `stairway2.path` | the folder (it contains `stairway_plot_es`) |
| `colony` | `gl.run.colony`, `gl.diagnostics.relatedness` | `colony.path` | the folder |
| `emibd9` | `gl.run.EMIBD9`, `gl.kin`, `gl.sim.relatedness` | `emibd9.path` | the folder |
| `eems` | `gl.run.eems` | `eems.path` | the folder |
| `plink` | `gl2plink`, `gl2vcf`, `gl.impute`; `gl.inbreeding`, `gl.read.PLINK` | `plink.bin.path`; `plink.path` | the folder |
| `beagle` | `gl.impute(method = "beagle")` | `beagle.bin.path` | the folder holding the `.jar` |
| `bayescan` (`dev` only) | `gl.run.bayescan` | `bayescan.path` | the folder or the executable |

`gone` and `ms` can be downloaded, but no function in 1.2.6 takes them: `gl.TajimasD()` no longer needs ms. **[tested 1.2.6]**

Programs that `gl.download.binary()` does not provide, and the user must install: PHYLIP for `gl.tree.fitch` (`phylip.path`), NewHybrids for `gl.nhybrids` (`nhyb.directory`), BLAST+ for `gl.blast`, mongrail for `gl.run.mongrail`, GCTA for `gl.inbreeding` (`gcta.path`). `gl.run.snmf` needs the R package LEA from Bioconductor, not a program. **[help of each function]**

### Running them

- **Pass absolute paths** for the program folder and the output folder: `normalizePath("bin/colony")`. Some wrappers change the working directory before calling the program, and relative paths then point nowhere (`exit 127`, `not found`). **[developer note]**
- **Keep the path to NewHybrids short.** Its executable crashes when the path to its input file reaches 100 characters. **[help]**
- **Keep individual names short, unique and free of spaces** before calling EMIBD9, COLONY or `related`. Names over about 20 characters are truncated by those programs, and collisions have produced a matrix of pair counts instead of relatedness. **[developer note]**
- **`gl.blast()` finds BLAST through `PATH`**, which a non-interactive `Rscript` session may not share with the terminal. Set `PATH` in `~/.Renviron` if it reports that `blastn` is missing. **[developer note]**
- **Say plainly when a program is needed.** If the user has not installed it, the call cannot run, and no R-only substitute gives the same analysis.

## 9. Installing, updating and version differences

Versions on 10 November 2026. CRAN and the GitHub `main` and `beta` branches hold dartR.base 1.2.3 and the other dartR.* packages 1.2.2 (March 2026). The `dev` branches hold 1.2.6, which this reference was built from. The umbrella package differs as well: dartRverse 1.0.6 on CRAN, 1.2.2 on `main` and `beta`, 1.2.7 on `dev`. When a version matters, ask the user to run `dartRverse_install()` and paste the table: it lists what is installed beside what each source holds. It needs internet and took about 35 seconds here. **[tested 2026-11-10]**

### Installing and updating

`dartRverse_install()` was rewritten between dartRverse 1.0.6 and 1.2.7, so the same call does different things. Check `packageVersion("dartRverse")` before telling a user what a call will do.

- **`install.packages("dartRverse")` installs the umbrella package and nothing else.** The dartR.* packages are not among its dependencies, so no `gl.*` function exists until dartR.base is installed. **[tested: DESCRIPTION of 1.0.6 and 1.2.7]**
- **Three dependencies are on Bioconductor, not CRAN:** SNPRelate and snpStats for dartR.base, LEA for dartR.popgen. With dartRverse 1.0.6, install them first with `BiocManager::install()`, as the package README says; R cannot find them on CRAN otherwise. Version 1.2.7 installs the missing ones itself. **[dependency lists of 1.2.6; README; help]**
- **`dartRverse_install("all")` installs nothing on 1.0.6.** It prints the commands for the user to run. On 1.2.7 it installs or updates all seven packages. **[source of 1.0.6 and 1.2.7]**
- **One package per call works on every version:** `dartRverse_install("dartR.popgen", rep = "CRAN")`. Version 1.2.7 also accepts several names; 1.0.6 does not. **[source of 1.0.6; tested 1.2.7]**
- **Write `rep = "Github"` whenever you give `branch`.** `rep` defaults to `"CRAN"`. On 1.0.6, `dartRverse_install("dartR.base", branch = "dev")` ignores the branch and installs the CRAN release without saying so, and the user believes they have the fix. On 1.2.7 the same call stops with an error. **[source of 1.0.6; tested 1.2.7]**
- **Installing from CRAN replaces whatever is installed, including a newer GitHub version.** Neither version of the function compares version numbers, so `dartRverse_install("all")` on 1.2.7, or `install.packages("dartR.base")`, takes a user on 1.2.6 back to 1.2.3. Read the version table first. **[source of 1.0.6 and 1.2.7]**
- **A GitHub install changes only the packages named.** dartR.spatial and dartR.captive from `dev` require dartR.data 1.2.5 or later, and dartR.spatial also requires dartR.base 1.2.4 or later; those versions are not on CRAN, so the requirement cannot be met from the CRAN releases. Install dartR.data, then dartR.base, from the same branch first, or use `"all"` on 1.2.7, which installs them in the right order. **[DESCRIPTION of 1.2.6; help; install not run]**
- **A GitHub install also installs every suggested package.** dartR.base suggests 60, so the first install on a new computer takes a long time. **[source of 1.2.7; DESCRIPTION]**
- **Do not assume `beta` has a fix.** The package describes `main` as the CRAN submission, `beta` as tested fixes waiting for CRAN, and `dev` as untested. On 10 November 2026 `beta` held the same versions as CRAN, and the `gl.impute` fix below was on `dev` only. Say so when you send a user to `dev`. **[tested 2026-11-10]**
- **`dartRverse_install()` does not update dartRverse itself.** Use `install.packages("dartRverse")` and restart R. **[help]** For the 1.2.7 behaviour before it reaches CRAN: `remotes::install_github("green-striped-gecko/dartRverse", ref = "dev")`. **[not tested]**
- **The old package cannot be installed this way.** `dartRverse_install("dartR")` stops with `Unknown dartRverse package` on 1.2.7. **[tested 1.2.7]**
- **Some functions compile C++ code the first time they are called in a session,** so they need a compiler as well as R: Rtools on Windows, the Xcode command line tools on a Mac, the `r-base-dev` package or its equivalent on Linux. The package installs and loads without one, and the call then fails at the compilation step, because these functions have no version written in R to fall back on. In 1.2.6 they are `gl.dist.ind`, `gl.report.replicates`, `gl.report.replicates.KING`, `gl.report.hamming`, `gl.filter.hamming` and `gl.report.allelerich` in dartR.base, `gl.sim.WF.run` in dartR.sim, and any function that calls one of them. The CRAN release compiles its distance, replicate, Hamming and allelic richness code in the same way. The first call is also slower: `gl.dist.ind()` on `platypus.gl` took 1.7 s, then 0.1 s. **[source of 1.2.6 and 1.2.3; timing tested 1.2.6; not run on a computer without a compiler]**

To move a user from the CRAN releases to `dev`, with dartRverse 1.2.7:

```r
dartRverse_install("all", rep = "Github", branch = "dev")
```

With dartRverse 1.0.6, one call per package, in this order:

```r
for (p in c("dartR.data", "dartR.base", "dartR.popgen", "dartR.spatial", "dartR.sim", "dartR.captive", "dartR.sexlinked"))
  dartRverse_install(p, rep = "Github", branch = "dev")
```

The order is the one version 1.2.7 uses. The loop itself was not run here. **[source of 1.2.7; not tested]**

### Differences that change results

- **`gl.impute(method = "frequency")` and `method = "HW"` mislabel individuals on dartR.base 1.2.3.** The function returns individuals regrouped by population, but copies `pop` and `ind.metrics` across in the original order. On `platypus.gl`, 52 of 81 individuals came back with another individual's population and 77 of 81 with another individual's metadata row; the genotypes still carry the right individual names. Every analysis that uses populations or metadata after imputation is then wrong. It is fixed on the `dev` branch (1.2.6) and not on `main` or `beta`. On 1.2.3, sort by population first, `x <- x[order(pop(x)), ]`, which was tested and returns everything aligned, and confirm with `identical(indNames(imputed), indNames(x))`. **[tested 1.2.3 and 1.2.6; branches checked 2026-11-10]**
- **Function arguments.** Between dartR.base 1.2.3 and 1.2.6, 18 of 152 shared functions gained arguments (for example `gl.filter.hwe`, `gl.read.vcf`, `gl.test.heterozygosity`, `gl.tree.nj`), and six functions left dartR.base (`gl.amova` is now in dartR.popgen, `gl.He` and `gl.Ho` in dartR.sim, `gl.propShared` in dartR.spatial; `gl.mahal.assign` and `gl.document` are no longer exported). An `unused argument` error on a call taken from this reference usually means the user is on the CRAN release. **[tested 1.2.3 and 1.2.6]**
- **Other faults in the CRAN releases that give a wrong result without an error.** They are in dartR.base 1.2.3 and in version 1.2.2 of dartR.popgen, dartR.captive and dartR.sexlinked, and are corrected on `dev`. For each one the faulty code was read in the CRAN source and the correction in the `dev` change log; only the first was also run. **[source of the CRAN releases; NEWS of dev]**
  - `gl.read.csv()`, `gl.read.PLINK()` and `gl.read.fasta()`: the object is converted to file-backed whatever `fbm` says, and at `verbose` 2 or lower, which includes the default, the genotypes are then discarded. `gl.read.csv()` on the example file of dartR.data returned an object with 0 individuals. With `verbose = 3` the genotypes are kept and the object is file-backed; `x <- gl.fbm2gen(gl.read.csv(file, verbose = 3))` gave a complete object in memory. **[tested 1.2.3 for `gl.read.csv`]**
  - `gl.report.heterozygosity()` with `n.invariant` above 0: the standard errors of the adjusted heterozygosities are too large by a factor of `sqrt((nLoc + n.invariant) / nLoc)`. With `nboots` above 0 as well, the bootstrap intervals of the adjusted values come from a calculation that multiplies a per-locus vector by a per-individual one.
  - `gl.test.heterozygosity()`: the labels `sig @0.05` and `sig @0.01` are taken from the `alpha` and `1 - alpha` quantiles of the bootstrap distribution, which is a two-sided test at twice the stated level. Use the `pval` column. The function also accepts SilicoDArT data and returns "heterozygosity" differences for presence/absence scores.
  - `gl.map.interactive()` with a matrix between individuals: the rows of the matrix are sorted by individual name and the columns and coordinates are not, so links join the wrong individuals unless the individuals are already in alphabetical order.
  - `gl.plot.heatmap()` given a matrix: the matrix goes through `as.dist()`, which keeps the lower triangle and sets the diagonal to zero. A relatedness matrix loses its self-values and an asymmetric matrix loses one direction.
  - `gl.report.hamming()`: the table of losses at each threshold counts pairs of loci, from quantiles of the pairwise distances. It is not the number of loci that `gl.filter.hamming()` removes. On 1.2.3 the function returns the genlight unchanged; on 1.2.6 it returns the table, so `x <- gl.report.hamming(x)` replaces the data.
  - `gl.nhybrids()` in dartR.popgen: in `aa-PofZ.csv` the column `P0` holds the text `NoName`, and every posterior probability sits one column to the right of its label. SilicoDArT data are accepted and recoded so that absence becomes a homozygote and presence a heterozygote.
  - `gl.infer.sex()` in dartR.sexlinked: `agreed.sex` is `*F` for a tie between one female and one male assignment, for an individual with no usable genotypes, and for every individual when `system` is not the one used in `gl.keep.sexlinked()`.
  - `gl.grm.network()` in dartR.captive: see section 7.

  The list is not complete. The change log of each `dev` branch records every correction made since the CRAN release, for example <https://github.com/green-striped-gecko/dartR.base/blob/dev/NEWS.md>. Read it when a user on the CRAN release reports a number that looks wrong.

## 10. File-backed objects

A file-backed object keeps its genotypes in a file on disk (slot `@fbm`, a file-backed matrix of the bigstatsr package) and not in memory (slot `@gen`), so that data larger than the computer's memory can be analysed. `gl.read.dart()`, `gl.read.vcf()`, `gl.read.csv()`, `gl.read.PLINK()`, `gl.read.fasta()` and `gl.load()` create one when `fbm = TRUE`. `gl.gen2fbm()` converts an object in memory and `gl.fbm2gen()` converts back. The items below were run on a file-backed copy of `platypus.gl` unless marked otherwise. **[tested 1.2.6]**

- **Use them only when the data do not fit in memory.** They are newer than the rest of the suite: the dartR.base `dev` change log records more than a dozen corrections to file-backed behaviour since the CRAN release. For data that fit in memory, leave `fbm = FALSE`. **[NEWS of dev]**
- **The genotypes are written to R's temporary folder, which is deleted when the session ends.** Every subset or filter of a file-backed object writes another file there: `x[1:10, ]`, `gl.keep.pop()` and `gl.filter.callrate()` each added one. A long script on large data therefore needs disk space in the temporary folder as well as memory.
- **`saveRDS()` saves a pointer to that file, not the genotypes.** In the next session the object loads and `nInd()` and `nLoc()` answer, but the first function that reads genotypes stops with `Error when mapping file: No such file or directory`. Save with `gl.save()`, which converts the object back to memory first; it then reloads complete, in memory.
- **To keep the file between sessions, name it.** `gl.gen2fbm(x, backingfile = "data/geno")` writes `data/geno.bk`, and an object saved with `saveRDS()` then reloads for as long as that file stays where it is. Subsets and filters of the object still go to the temporary folder.
- **`gl.pcoa()` gives different numbers for the same data when genotypes are missing.** On `platypus.gl` the first axis explained 7.04% of the variance in memory and 7.87% file-backed. In memory a missing genotype is replaced by the locus mean; on a file-backed object `gl.pcoa()` first imputes it from the nearest neighbour, with no message at `verbose = 0`. Without missing data the two results were identical. When the result has to match an in-memory analysis, call `gl.pcoa(gl.fbm2gen(x))`, which returned the in-memory eigenvalues exactly. A correction that makes the two agree is on the `dev_luis` branch of dartR.base and had not been merged into `dev` on 11 November 2026.
- **Only SNP data can be file-backed.** `gl.gen2fbm()` on a SilicoDArT object stops with `Only SNP data can be converted to FBM at this time`.
- **On the CRAN release three readers return file-backed or empty objects whatever `fbm` says.** See section 9, "Differences that change results". **[tested 1.2.3]**
