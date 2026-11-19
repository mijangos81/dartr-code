# dartRverse traps, by topic

Calls that run without an error and give a wrong or misleading result, plus a few that fail in ways that are hard to diagnose. Read the section for the analysis you are writing. Section 9 also lists the results that change when a user moves from the old CRAN releases to 1.3.0.

Each item carries its evidence:

- **[tested 1.3.0]** reproduced on dartR.* 1.3.0 (the `beta` branches, the release submitted to CRAN) with the data bundled in dartR.data 1.2.7, on 19 November 2026.
- **[tested 1.2.6]** reproduced on the 1.2.6 `dev` branches on 10–11 November 2026 and not re-run on 1.3.0.
- **[tested 1.2.3]** reproduced on the CRAN release dartR.base 1.2.3.
- **[source of ...]** read from the function's source code in that version, not run. Installs were run only into separate scratch libraries, never into the machine's own.
- **[help]** stated in the function's own help page in 1.3.0.
- **[NEWS 1.3.0]** described in the package's change log (`NEWS.md`) for the 1.3.0 release, which includes the 1.2.7 development entries; read on 19 November 2026, not run.
- **[developer note]** recorded by the dartR developers while analysing real datasets or testing a release; not re-tested for this file.

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

- **`gl.keep.ind()` keeps the object's order, not the order of `ind.list`.** Asking for `c("T30", "SUS20", "SDS2")` returned `SUS20, T30, SDS2`, the order in the object. Assigning `pop(g) <- labels` by position afterwards scrambles the labels; in one real analysis this collapsed regional FST to about zero. Assign by name: `pop(g) <- labels[match(indNames(g), ids)]`. **[tested 1.3.0]**
- **Join a sample sheet by name.** `x@other$ind.metrics` is in the object's order, which is the order of the DArT report, not of the user's spreadsheet. DArT sample names can be the lab's target IDs rather than the user's field IDs, so check that the names match before joining. **[developer note]**
- **`x[i, j]` keeps `ind.metrics`, `loc.metrics` and `latlon` in step with the genotypes**, so it is safe for subsetting. It does not recalculate locus statistics. **[tested 1.3.0]**
- **Subsetting leaves monomorphic loci and stale `loc.metrics`.** `gl.keep.pop()`, `gl.drop.pop()`, `gl.keep.ind()`, `gl.drop.ind()` and the call-rate filter by individual default to `recalc = FALSE, mono.rm = FALSE`. Keeping the 23 SEVERN_ABOVE individuals of `platypus.gl` leaves 513 of 1,000 loci monomorphic or entirely missing (425 for the 41 TENTERFIELD), and `CallRate` as it was for all 81 individuals. Pass `recalc = TRUE, mono.rm = TRUE`, or call `gl.recalc.metrics()` and `gl.filter.monomorphs()` afterwards. **[tested 1.3.0]**
- **`rbind()` on two genlights.** From 1.3.0 it matches loci by name and stops when the two objects code the alleles of a locus differently. On dartR.base 1.2.3 it stacked in-memory objects by locus position, so genotypes landed under the wrong loci when the order differed (1,722 of 4,636 genotypes for five `platypus.gl` individuals), and it returned an empty `@other`. On an older version check `identical(locNames(a), locNames(b))` first. **[NEWS 1.3.0]**
- **`gl.join()` needs the same individuals (to add loci) or the same loci (to add individuals).** **[help]** Two datasets genotyped or called separately can disagree on which allele is the reference at a shared locus (about 10% of shared loci in one case), which silently inverts genotypes on merging. Compare allele labels before joining. **[developer note]**
- **Rename populations before a structure analysis, not after.** `gl.plot.snmf()` and `gl.plot.popcluster()` match population labels between the result and the genlight by name; renaming `pop(x)` afterwards drops the renamed populations from the legend. **[developer note]**
- **Give individuals and populations plain, unique names:** letters, digits, `_` and `.`, with no spaces and no accented characters. Names are written to text files on their way to PopCluster, EMIBD9, COLONY and other programs, and failures in those programs have been traced back to a space or an accent in a name. Rename at the start of the script, before anything is computed from the names. **[developer note]**

## 2. Reading data

- **`gl.read.dart()` drops samples that have no row in `ind.metafile`.** With 10 of 250 rows removed from the example metadata, it returned 240 individuals and raised no error. Give every sample a row, then compare `nInd(x)` with the number expected. **[tested 1.3.0]** `gl.read.silicodart()` does the same; `gl.read.vcf()` keeps such individuals from 1.3.0. **[NEWS 1.3.0]**
- **The metadata file needs an `id` column that matches the sample names in the data file exactly** (case and spaces included). `pop`, `lat` and `lon` are recognised and fill `pop(x)` and `x@other$latlon`; other columns are kept in `ind.metrics`. Without a metadata file all individuals fall into one population, `pop1`. **[tested 1.3.0]**
- **`gl.read.vcf()` also takes `ind.metafile`.** Use it rather than adding populations by hand afterwards. **[help]**
- **`gl.read.dart()` keeps each sample's DArT order and plate position.** They are in `x@other$ind.metrics$service` (the order number, `DPla19-4171` in `platypus.gl`) and `x@other$ind.metrics$plate_location` (plate and well, `2-A10`). **[tested 1.3.0]** When a dataset combines several orders, colour a PCoA by `service` before interpreting it: groups that follow the order and not the sampling sites are a batch effect. `gl.report.contamination()` reads the same two columns to test whether suspect samples sat in adjacent wells. **[developer note; help]**
- **The readers do not all count the same allele.** `gl.read.vcf()` counts the ALT allele; `gl.read.PLINK()` counts the second allele of the `.bim` file and, from 1.3.0, stores the alleles as `allele.1/allele.2`. **[NEWS 1.3.0]** The same PLINK data read on 1.3.0 through `.ped`, `.bed` and a 0/1/2 CSV gave genotype sums of 9,648, 6,802 and 3,048. **[developer note]** Before joining or comparing objects read by different routes, check `x@loc.all` and compare allele frequencies at a few loci.
- **On dartR.base 1.2.3, `gl.read.csv()`, `gl.read.PLINK()` and `gl.read.fasta()` return an object with no genotypes** at the default verbosity. **[tested 1.2.3]** Fixed in 1.3.0: `gl.read.csv()` on its help-page example kept every genotype at the default verbosity. **[tested 1.3.0]**
- **Save and reload with `gl.save()` and `gl.load()`.** They wrap `saveRDS()` / `readRDS()`; `gl.load(compliance = TRUE)` also runs the compliance check (on 1.2.3 the argument was ignored). **[help; NEWS 1.3.0]** An object built or edited by hand should go through `gl.compliance.check()` before other functions use it. For file-backed objects see section 10.

## 3. Reports, plots and verbosity

- **`verbose = 0` turns off plots.** With `plot.display = TRUE` left at its default, `gl.report.callrate`, `gl.report.heterozygosity`, `gl.report.maf`, `gl.filter.callrate`, `gl.report.rdepth`, `gl.dist.pop`, `gl.report.fstat`, `gl.report.sexlinked` and `gl.filter.sexlinked` each drew a plot at `verbose = 1` or higher and none at `verbose = 0`. `gl.set.verbosity(0)` has the same effect on every later call. Use `verbose = 1` to keep the figure. A report function still prints its tables at 1 (`gl.report.callrate` printed 37 lines at 1 and 40 at 2); a filter prints a line or two. **[tested 1.3.0]**
- **`plot.file` saves an `.RDS` file, not an image.** The file holds the ggplot (or patchwork) object and is written to `plot.dir`, or to the working directory when `plot.dir` is not given. To get a picture: `p <- readRDS(file.path(dir, "name.RDS")); ggplot2::ggsave("name.png", p, width = 7, height = 5)`. **[tested 1.3.0]**
- **Report functions return different things.** Check **Returns** before assigning. **[tested 1.3.0]**

  | Returns | Functions |
  |---|---|
  | The genlight, unchanged | `gl.report.callrate`, `gl.report.monomorphs`, `gl.report.rdepth`, `gl.report.reproducibility`, `gl.report.overshoot`, `gl.report.bases`, `gl.report.allna`, `gl.report.locmetric`, `gl.report.taglength` |
  | A data frame | `gl.report.heterozygosity`, `gl.report.maf`, `gl.report.secondaries`, `gl.report.hwe`, `gl.report.pa`, `gl.report.hamming`, `gl.report.ld.map` |
  | A list | `gl.report.fstat`, `gl.report.diversity`, `gl.report.replicates` |
  | `NULL` | `gl.report.basics` |

  Two of these changed between dartR.base 1.2.3 and 1.3.0. `gl.report.monomorphs()` used to return the object with the monomorphic and all-missing loci removed, so `x <- gl.report.monomorphs(x)` filtered on 1.2.3 and does nothing on 1.3.0. `gl.report.hamming()` used to return the genlight, so the same assignment now replaces the data with a table. **[NEWS 1.3.0; 1.3.0 side tested]**
- **Plot argument names are not uniform.** Most functions use `plot.display`, `plot.theme`, `plot.colors`; about 40 functions still use `plot.out`, `plot_theme` or `plot_colors` (for example `gl.pcoa`, `gl.report.replicates`, `gl.LDNe`). The full list is in `migration-from-dartR.md`, section 2. **[tested 1.3.0]**
- **`gl.report.replicates()` lists only the pairs above its threshold**, not every pair compared. An empty table means no pair passed, not that nothing was compared. **[developer note]**

## 4. Filtering and imputation

- **`gl.filter.maf()` treats a threshold above 1 as a minor allele count.** It converts the count to a frequency as `threshold / (nInd * ploidy)`, using all individuals, so with missing data it is not exactly "at least 3 copies observed": on `platypus.gl`, `threshold = 3` kept 554 loci where 550 have three or more copies of the minor allele. Report it as the function defines it. A count is often the better choice when groups differ in size. **[tested 1.3.0]**
- **Filter loci on call rate before individuals.** Individual call rate is measured against the loci still in the object. On one dataset, requiring 0.90 per individual on the raw 44,000 loci dropped 191 of 272 samples; the same samples passed once poor loci had been removed. **[developer note]**
- **`gl.filter.hwe()` tests within each population by default (`subset = "each"`).** `subset = "all"` pools the populations, and the help page notes the test is only valid without substructure. Populations of fewer than about 15 individuals have little power. **[help]** From 1.3.0 it takes `direction = "both"`, `"excess"` or `"deficit"` and `min.hobs`; `gl.filter.excess.het()` and `gl.report.excess.het()` are deprecated wrappers for `direction = "excess"` and will be removed. **[help; NEWS 1.3.0]**
- **`gl.filter.hamming()` takes a count of mismatching bases** (`threshold = 3` by default). On 1.2.3 it took a proportion of the tag length (default 0.2); a value between 0 and 1 now stops with an error, so an old script fails rather than filtering differently. **[tested 1.3.0]**
- **`gl.filter.secondaries(method = "random")` picks one SNP per sequence tag at random**, so the retained loci change between runs unless the seed is set. **[help]**
- **Screen for contamination before removing replicates.** From each pair of replicates, `gl.filter.replicates()` removes the sample with more missing data. **[help]** A sample that carries a second individual's DNA is usually the one with less missing data, so the filter tends to keep the contaminated sample and discard the clean one. Run `gl.report.contamination()` and `gl.filter.contamination()` first. Both are new in dartR.base 1.3.0 and are not in 1.2.3. **[developer note]**
- **`gl.impute()` works population by population.** The same data imputed under two different `pop(x)` assignments gives different genotypes: 568 differed on `platypus.gl` with the populations shuffled and the same seed. If `pop` is the grouping you then show in a PCoA, imputation pulls each group towards its own allele frequencies and the groups look more distinct than the data support. Impute on a neutral grouping such as locality and use the grouping of interest only to colour the plot. **[tested 1.3.0; consequence from a developer note]**
- **`method = "frequency"` is not fully deterministic.** From 1.3.0 it fills each missing genotype with the rounded expected dosage in the individual's population (it used to draw at random, like `"HW"`). **[NEWS 1.3.0]** The `fill.residual = TRUE` step that then fills loci missing in a whole population is still random: two runs differed in 10 genotypes at one locus, and were identical after the same `set.seed()`. Set the seed. **[tested 1.3.0]**
- **`gl.impute()` leaves loci that are missing in every individual as `NA`**, with every method and even with `fill.residual = TRUE`: 486 missing values remained on `platypus.gl`, from 6 such loci. Run `gl.filter.allna()` first and check `sum(is.na(as.matrix(x)))` afterwards. **[tested 1.3.0]**
- **`method = "neighbour"` (the default) has two known problems.** Its distance step used more than 64 GB on an object of only 307 individuals by 300 loci in one case, and it favours individuals with few scored loci as donors: on `bandicoot.gl` one individual was the nearest neighbour of 55 of 96 (1.2.7). `method = "frequency"` is the safer first choice, for example when preparing data for LD work. **[developer note]**
- **Sex-linked loci.** `gl.drop.sexlinked()` is deprecated: on 1.3.0 it warns and runs `gl.filter.sexlinked()`. Both `gl.filter.sexlinked()` and `gl.report.sexlinked()` need `system = "xy"` or `"zw"` (there is no default), and a `sex` column in `ind.metrics` coded `F` / `M` (or `Female` / `Male`); anything else is treated as unknown. A wrong `system` gives a plausible but wrong classification. **[tested 1.3.0; help]**

## 5. Statistics that are not what the name suggests

- **FST.** `gl.fst.pop()` estimates Weir and Cockerham's (1984) theta. `gl.report.fstat()` reports Nei's (1987) Fst and Fstp, Jost's D and Hedrick's Gst_H. The two families differ, sometimes substantially, when sample sizes are uneven. Name the estimator in the text. **[help]**
- **`gl.fst.pop()` return value.** With `nboots = 1` (default) it is a matrix with values in the lower triangle and `NA` elsewhere, with populations in order of first appearance, not factor-level order (reversing the levels did not change the order). With `nboots > 1` it is a list with `Fsts`, `Pvalues` and `Bootstraps`, and `set.seed()` before the call makes it reproducible. `nclusters` is accepted and ignored. Use `as.matrix(as.dist(fst))` for a symmetric matrix. **[tested 1.3.0]**
- **`gl.report.heterozygosity()` columns.** `n.Ind` is the mean number of individuals with a genotype per locus, so 114.8 for a population of 116 is not a missing individual. `FIS` is the mean of per-locus values, so it will not equal `1 - Ho / uHe` computed from the tabulated means when diversity is low. **[developer note]**
- **Genome-wide heterozygosity needs the invariant sites.** Heterozygosity from SNPs alone is inflated relative to the genome. `gl.report.heterozygosity(n.invariant = )` adjusts for it; the count comes from `gl.report.secondaries()`. **[help]**
- **The site frequency spectrum and Tajima's D.** Do not apply a MAF filter first: it removes the rare alleles these statistics are built from. In clonal organisms remove clones (`gl.report.replicates()`) before SFS work. **[developer note]** From 1.3.0 `gl.sfs()` builds the spectrum only from loci scored in every individual, so with missing data it uses fewer loci than the object holds, and `gl.run.stairway2()` and `gl.run.epos()` results change with it. **[NEWS 1.3.0]**
- **`gl.report.ld.map()` and related LD reports** compute r² from haplotype frequencies estimated by EM. NeEstimator (behind `gl.LDNe()`) and PLINK `--r2` use the composite genotypic r² (squared correlation of allele dosages). The two agree only under Hardy-Weinberg proportions; they correlated 0.68 on one small sample. To reproduce NeEstimator's values in R use `cor(as.matrix(x), use = "pairwise.complete.obs")^2`. **[developer note]** On 1.3.0 `gl.report.ld.map()` also drops every locus that has a missing genotype in the population. **[developer note]**
- **`gl.report.nall()` (dartR.sim) is not reproducible.** Two calls after the same `set.seed()` returned different results, so do not present its numbers as reproducible. **[tested 1.3.0]**
- **`gl.pcoa()` loadings.** Row names of `$loadings` are `locus.allele` (for example `45055704-36-G/A.G/A`), and monomorphic loci are dropped by default (`mono.rm = TRUE`: 641 rows for 1,000 loci in `platypus.gl`), so the rows neither match nor line up with `locNames(x)`. Strip the suffix and match by name. **[tested 1.3.0]**
- **`gl.dist.ind()`** defaults to Euclidean distance for SNP data and simple matching for presence/absence data. Jaccard, Bray-Curtis and Sorensen are for presence/absence data only. **[help; developer note]**

## 6. Genome positions

- **After `gl.read.dart()`, `x@position` and `x@chromosome` are empty (`NULL`).** The slots hold genome coordinates only, from 1.3.0. The SNP's position within its sequence tag is in `x@other$loc.metrics$SnpPosition` (counted from 0). On 1.2.x `gl.read.dart()` copied `SnpPosition` into `x@position`, and the bundled `platypus.gl` (dartR.data 1.2.7) still carries it there, so code tried on `platypus.gl` does not show what a freshly read report looks like. **[tested 1.3.0; NEWS 1.3.0]** Chromosome and base-pair position are in `loc.metrics` columns whose names include the reference genome, such as `Chrom_Platypus_Chrom_NCBIv1` and `ChromPos_Platypus_Chrom_NCBIv1`. Functions that use map positions read the slots, so set them first: **[tested 1.3.0]**

  ```r
  chromosome(x) <- as.factor(x@other$loc.metrics$Chrom_Platypus_Chrom_NCBIv1)
  position(x)   <- as.integer(x@other$loc.metrics$ChromPos_Platypus_Chrom_NCBIv1)
  ```

  Loci that did not align have a blank chromosome (79 of 1,000 in `platypus.gl`); decide whether to drop them before analyses that need a map.
- **The column name states which genome DArT aligned the tags to.** `Chrom_Platypus_Chrom_NCBIv1` means that assembly, so it is the one to cite in the methods and the one to use when looking positions up. Another assembly of the same species has different coordinates. Of the datasets bundled in dartR.data only `platypus.gl` has these columns; an object without them carries no alignment. **[tested 1.3.0; developer note]**
- **`gl2plink()` writes round positions in scientific notation.** On 1.3.0 positions 100000, 200000 and 1000000 went into the `.map` file as `1e+05`, `2e+05` and `1e+06`. Run `options(scipen = 999)` before the call; with it the same positions were written in full. **[tested 1.3.0]** When the slots are empty, `gl2plink()` writes chromosome 0 and position 0, PLINK's code for an unmapped locus. **[NEWS 1.3.0]**
- **`gl.blast()` followed by `gl.find.genes.for.loci()` needs the same hand-off.** `gl.blast()` writes the best hit to `loc.metrics` (`sacc`, `sstart`); copy them into the slots as above before looking up genes. **[developer note]**
- **`gl.LDNe(pairing = "separate")` uses the chromosome slot.** NeEstimator reads only the first characters of each chromosome name, and long names such as `HiC_scaffold_1` crashed it or merged chromosomes before 1.3.0, which handles long names. **[developer note; NEWS 1.3.0]** On an older version recode to integers: `chromosome(x) <- as.factor(as.integer(chromosome(x)))`.

## 7. Relatedness and kinship

- **Kinship is half of relatedness.** Full siblings have relatedness 0.5 and kinship 0.25; an individual with itself has relatedness 1 and kinship 0.5 (more if inbred). Check which scale a function returns before applying a threshold. **[developer note]**
- **`gl.run.EMIBD9()$rel` is on the kinship scale** (the diagonal is `0.5 * (1 + F)`) and tagged `attr(, "scale") = "kinship"`. **[help]** Its rows and columns have come back in alphabetical order rather than the object's order; index it by name, and never overwrite its `dimnames` with `indNames(x)`. **[developer note]**
- **`gl.grm()` is in dartR.captive, not dartR.base.** `dartR.spatial::gl.grm2()` is the equivalent when dartR.captive is not installed. `gl.grm()` returns relatedness, tagged `attr(G, "scale") = "relatedness"`. **[tested 1.3.0]**
- **`gl.relatedness()` runs a separate program, `dartR_coancestry`.** Download it with `gl.download.binary("coancestry")` and pass the folder as `coancestry.path` (default `getwd()`). The estimators are `"wang"`, `"lynchli"`, `"lynchrd"`, `"ritland"`, `"quellergt"`, `"dyadml"` and `"trioml"`; `"loiselle"` is no longer offered. Results are on the relatedness scale and tagged `"relatedness"`. Wang and Lynch-Li values sit above those of `related::coancestry()` by about 0.047 and 0.018 on the same data. **[help; NEWS 1.3.0; download tested 1.3.0]**
- **A genomic relationship matrix computed across structured populations inflates within-group values**, because divergence between groups is read as relatedness within them. Compute it within each group with that group's allele frequencies. **[developer note]**
- **`gl.grm.network(categorise = TRUE)` uses fixed kinship classes** (0.1, 0.2, 0.3). In inbred populations full siblings can exceed the top class and be drawn as the same individual. **[developer note]**
- **`gl.grm.network()` works on kinship, and whether it halves its input depends on the version.**
  - *dartR.captive 1.2.6 and 1.3.0.* The matrix is taken as relatedness and halved, unless it carries `attr(G, "scale") = "kinship"`. `gl.grm()` and `gl.relatedness()` tag their matrices `"relatedness"` and `gl.run.EMIBD9()$rel` is tagged `"kinship"`, so pass each one as it comes. Do not halve by hand: `G / 2` keeps the `"relatedness"` tag and is halved a second time. Subsetting drops the tag, so `K[ids, ids]` of a kinship matrix is halved by mistake. On 25 platypus with a largest kinship of 0.144, the network showed 0.144 for `G` and for the tagged `K`, and 0.072 for `K[ids, ids]` and for `G / 2`. After subsetting or reordering a kinship matrix, restore the tag with `attr(K, "scale") <- "kinship"`. The function returns a list with `plot` and `kinship`. **[tested 1.3.0]**
  - *dartR.captive 1.2.2 (still the CRAN release on 19 November 2026), with the default `standardise = FALSE`.* The values are used as they are. Halve a relatedness matrix from `gl.grm()` first; otherwise full siblings, with relatedness 0.5, are drawn in the "same individual" class, which starts at 0.3. **[source of 1.2.2]**

  A script that is right on one version is therefore wrong by a factor of two on the other. Check `packageVersion("dartR.captive")` before writing the call.

## 8. Programs outside R

Many functions run a separate program. `dartRverse::gl.download.binary()` fetches most of them from the dartRverse repository, where they can also be browsed: <https://github.com/green-striped-gecko/dartRverse/tree/dev/binaries>. The programs are other people's work, redistributed with their permission: cite the program, using the reference in the wrapper function's help page.

### Getting a program

```r
bin <- path.expand("~/dartr-binaries")                 # a folder that outlives the R session
gl.download.binary()                                    # table of programs available for each operating system
p <- gl.download.binary("neestimator", out.dir = bin, branch = "dev")   # downloads, unzips, returns the folder: bin/neestimator
ne <- gl.LDNe(x, neest.path = p)                        # folder arguments take that path as it is
```

- **Give `out.dir`.** It defaults to `tempdir()`, which R deletes when the session ends, so a script that relies on the default downloads the program again every time. `out.dir` is created if it does not exist. **[help 1.3.0]**
- **The function returns the folder `out.dir/<software>`, invisibly.** Keep it in a variable; it is already an absolute path if `out.dir` was. One program per call. Names are not case-sensitive from dartRverse 1.2.7: `"NeEstimator"` works. **[tested 1.3.0]**
- **Some arguments want the folder, others the executable file.** See the table. For a file argument, add the file name: `exec = file.path(p, "structure")`, or `"structure.exe"` on Windows. **[help of each function]**
- **`branch` defaults to `"main"`; two programs need `branch = "dev"`.** BayeScan is not on `main` (the table does not list it, and asking for it fails with `Binary for bayescan on mac not available`). And on `main` the Mac archive of NeEstimator unpacks its executable straight into `out.dir`, so the folder the function returns does not exist. With `branch = "dev"` both arrived in their own folders. Check with `dir.exists(p)`. **[tested 1.3.0, 19 November 2026]**
- **Not every program exists for every system.** fastStructure has no Windows build. `os = "linux"` downloads the Linux build from another system, for example to prepare a cluster run. **[tested 1.3.0]**
- **Mac builds are a mix of processor types.** STRUCTURE, NeEstimator, COLONY, PLINK, PopCluster, fastStructure and GONE are Intel builds, so an Apple Silicon Mac runs them through Rosetta 2, which must be installed. EEMS, EMIBD9, EPOS and ms are Apple Silicon builds and will not run on an Intel Mac. BayeScan and `dartR_coancestry` run on both. A `Bad CPU type in executable` error means this. **[main executable of each program checked 2026-11-10; dartR_coancestry 2026-11-19]**
- **dartRverse 1.0.6, the CRAN release, does not make the files executable on Mac or Linux.** Versions 1.2.7 and later do (mode 777). On 1.0.6 a wrapper fails with `Permission denied` until you run `Sys.chmod(list.files(p, full.names = TRUE, recursive = TRUE), "0755")`. **[source of 1.0.6; tested 1.3.0]**
- **Beagle and Stairway Plot 2 are Java programs**, so Java must be installed as well. **[contents of the archives]**

### Which program goes with which function

| `software` | Functions | Argument | Give it |
|---|---|---|---|
| `structure` | `gl.run.structure` | `exec` | the executable file |
| `faststructure` | `gl.run.faststructure` | `exec`; `exec.plink` | the `fastStructure` file; the folder holding PLINK |
| `popcluster` | `gl.run.popcluster` | `popcluster.path` | the folder |
| `neestimator` | `gl.LDNe`, `gl.check.panel`, `gl.check.future.panel`, `gl.select.panel.combined`, `gl.select.panel.parallel`, `gl.diagnostics.relatedness` | `neest.path` | the folder |
| `epos` | `gl.run.epos` | `epos.path` | the folder |
| `stairway2` | `gl.run.stairway2` | `stairway2.path` | the folder (it contains `stairway_plot_es`) |
| `colony` | `gl.run.colony`, `gl.diagnostics.relatedness` | `colony.path` | the folder |
| `coancestry` | `gl.relatedness`, `gl.diagnostics.relatedness` | `coancestry.path` | the folder holding `dartR_coancestry` |
| `emibd9` | `gl.run.EMIBD9`, `gl.sim.relatedness` | `emibd9.path` | the folder |
| `eems` | `gl.run.eems` | `eems.path` | the folder |
| `plink` | `gl2plink`, `gl2vcf`, `gl.impute`; `gl.inbreeding`, `gl.read.PLINK` | `plink.bin.path`; `plink.path` | the folder |
| `beagle` | `gl.impute(method = "beagle")` | `beagle.bin.path` | the folder holding the `.jar` |
| `bayescan` (`dev` only) | `gl.run.bayescan` | `bayescan.path` | the folder or the executable |

`gone` and `ms` can be downloaded, but no function in 1.3.0 uses them: `gl.TajimasD()` accepts `ms.path` and ignores it, because its simulation now runs in R. **[tested 1.3.0; help]**

Programs that `gl.download.binary()` does not provide, and the user must install: PHYLIP for `gl.tree.fitch` (`phylip.path`), NewHybrids for `gl.nhybrids` (`nhyb.directory`), BLAST+ for `gl.blast`, mongrail for `gl.run.mongrail`, GCTA for `gl.inbreeding` (`gcta.path`). `gl.run.snmf` needs the R package LEA from Bioconductor, not a program. **[help of each function]**

### Running them

- **Pass absolute paths** for the program folder and the output folder: `normalizePath("bin/colony")`. Some wrappers change the working directory before calling the program, and relative paths then point nowhere (`exit 127`, `not found`). **[developer note]**
- **Keep the path to NewHybrids short.** Its executable crashes when the path to its input file reaches 100 characters. **[help]**
- **Keep individual names short, unique and free of spaces** before calling EMIBD9, COLONY or `related`. Names over about 20 characters are truncated by those programs, and collisions have produced a matrix of pair counts instead of relatedness. **[developer note]**
- **`gl.blast()` finds BLAST through `PATH`**, which a non-interactive `Rscript` session may not share with the terminal. Set `PATH` in `~/.Renviron` if it reports that `blastn` is missing. **[developer note]**
- **Say plainly when a program is needed.** If the user has not installed it, the call cannot run, and no R-only substitute gives the same analysis.

## 9. Installing, updating and version differences

### Versions on 19 November 2026

| Package | CRAN | GitHub `main` | `beta` | `dev` |
|---|---|---|---|---|
| dartR.base | 1.3.0 (18 November 2026) | 1.3.0 | 1.3.0 | 1.3.1 |
| dartR.popgen | 1.3.0 (18 November 2026) | 1.3.0 | 1.3.0 | 1.3.0 |
| dartR.spatial, dartR.captive, dartR.sexlinked, dartR.sim | 1.2.2 (March 2026) | 1.2.2 | 1.3.0 | 1.3.0 |
| dartR.data | 1.2.7 | 1.2.7 | 1.2.7 | 1.2.7 |
| dartRverse | 1.0.6 | 1.2.2 | 1.3.0 | 1.3.0 |

This reference was built from `beta`, the 1.3.0 release. The four add-ons at 1.2.2 are being submitted to CRAN one at a time. **[developer note]** Versions 1.2.4 to 1.2.7 of the analysis packages were never on CRAN, so a CRAN user goes from dartR.base 1.2.3 (and the other packages at 1.2.2) to 1.3.0 in one step, and meets every change listed under "Results that change" below at once. When a version matters, ask the user to run `dartRverse_install()` and paste the table: it lists what is installed beside what each source holds. It needs internet and took about 35 seconds. **[tested 2026-11-10]**

- **A CRAN install is mixed until the add-ons are accepted:** dartR.base and dartR.popgen 1.3.0 with dartR.spatial, dartR.captive, dartR.sexlinked and dartR.sim 1.2.2, and dartRverse 1.0.6. In that combination `library(dartRverse)` attached all six, and the 1.2.2 add-ons ran on the 1.3.0 base (`gl.grm`, `gl.grm.network`, `gl.ibd`, `gl.report.sexlinked`, `gl.sim.WF.table`). But dartR.captive 1.2.2 still exports its old `gl.assign.pa`, `gl.assign.on.genotype`, `gl.assign.pca` and `gl.assign.mahalanobis`, and `library(dartRverse)` attaches dartR.captive after dartR.popgen, so a plain `gl.assign.pa()` ran the dartR.captive 1.2.2 version and not the reviewed one in dartR.popgen 1.3.0. Write `dartR.popgen::gl.assign.pa()`, or install the 1.3.0 add-ons from `beta` (below). **[tested 2026-11-19]**
- **On an older R, `install.packages()` can install years-old binaries.** On R 4.4.2 for Apple Silicon, CRAN's binary repository held dartR.base 1.0.7, dartR.popgen 1.0.0, dartR.captive 1.0.2, dartR.spatial 1.0.3, dartR.sexlinked 1.0.5, dartR.sim 0.70 and dartR.data 1.2.2, against sources of 1.3.0, 1.2.2 and 1.2.7. In `Rscript`, `install.packages(c("dartR.captive", "dartR.spatial", "dartR.sexlinked", "dartR.sim"))` installed those old binaries without a message. Check `packageVersion()` after installing. Either install with `type = "source"` (the dartR packages need no compiler to install) or update R. **[tested 2026-11-19; an interactive session may ask before choosing, not tested]**

### Installing and updating

`dartRverse_install()` was rewritten between dartRverse 1.0.6 and 1.2.7, so the same call does different things. CRAN still has 1.0.6; 1.3.0 behaves like 1.2.7 and is on GitHub only. Check `packageVersion("dartRverse")` before telling a user what a call will do.

- **`install.packages("dartRverse")` installs the umbrella package and nothing else.** The dartR.* packages are only suggested, not dependencies, so no `gl.*` function exists until dartR.base is installed. **[DESCRIPTION of 1.0.6 and 1.3.0]**
- **Three dependencies are on Bioconductor, not CRAN:** SNPRelate and snpStats for dartR.base, LEA for dartR.popgen. With dartRverse 1.0.6, install them first with `BiocManager::install()`, as the package README says; R cannot find them on CRAN otherwise. Versions 1.2.7 and later install the missing ones themselves. **[dependency lists; README; NEWS of dartRverse]**
- **`dartRverse_install("all")` installs nothing on 1.0.6.** It prints the commands for the user to run. On 1.2.7 and later it installs or updates all seven packages from CRAN. **[source of 1.0.6 and 1.2.7; NEWS of dartRverse]**
- **One package per call works on every version:** `dartRverse_install("dartR.popgen", rep = "CRAN")`. Version 1.2.7 and later also accept several names; 1.0.6 does not. **[source of 1.0.6; tested 1.2.7]**
- **Write `rep = "Github"` whenever you give `branch`.** `rep` defaults to `"CRAN"`. On 1.0.6, `dartRverse_install("dartR.base", branch = "dev")` ignores the branch and installs the CRAN release without saying so, and the user believes they have the fix. On 1.2.7 and later the same call stops with an error. **[source of 1.0.6 and 1.3.0; tested 1.2.7]**
- **Installing from CRAN replaces whatever is installed, including a newer GitHub version.** The function does not compare version numbers, so `dartRverse_install("all")` on 1.2.7 or later, or `install.packages("dartR.captive")`, takes a user on the GitHub 1.3.0 add-ons back to 1.2.2. Read the version table first. **[source of 1.0.6 and 1.2.7; NEWS of 1.3.0 records no change]**
- **A GitHub install changes only the packages named.** The 1.3.0 add-ons require dartR.base 1.3.0 or later, which CRAN now has, so a user on dartR.base 1.2.3 must update it first; dartR.spatial and dartR.captive also need dartR.data 1.2.5 or later (CRAN has 1.2.7). `"all"` on 1.2.7 or later installs them in the right order. **[DESCRIPTION of 1.3.0]**
- **A GitHub install also installs every suggested package.** dartR.base suggests 61, so the first install on a new computer takes a long time. **[source of 1.2.7; DESCRIPTION of 1.3.0]**
- **Do not assume `beta` or `dev` has a given fix.** The package describes `main` as the CRAN submission, `beta` as tested fixes waiting for CRAN, and `dev` as untested. On 19 November 2026 `beta` held the 1.3.0 submissions, and `dev` was ahead only for dartR.base (1.3.1). Say which branch you send a user to and why. **[checked 2026-11-19]**
- **`dartRverse_install()` does not update dartRverse itself.** Use `install.packages("dartRverse")` and restart R. **[help]** For 1.3.0 before it reaches CRAN: `remotes::install_github("green-striped-gecko/dartRverse", ref = "beta")`. **[tested 2026-11-19, into a scratch library]**
- **The old package cannot be installed this way.** `dartRverse_install("dartR")` stops with `Unknown dartRverse package` on 1.2.7. **[tested 1.2.7]**
- **Some functions compile C++ code the first time they are called in a session,** so they need a compiler as well as R: Rtools on Windows, the Xcode command line tools on a Mac, the `r-base-dev` package or its equivalent on Linux. The package installs and loads without one, and the call then fails at the compilation step, because these functions have no version written in R to fall back on. In 1.3.0 they are `gl.dist.ind`, `gl.report.replicates`, `gl.report.hamming`, `gl.filter.hamming` and `utils.allelic.richness` in dartR.base, `gl.sim.WF.run` in dartR.sim, and the functions that call them, such as `gl.dist.pop`, `gl.impute`, `gl.propShared` and `gl.smearplot`. The first call is also slower: `gl.dist.ind()` on `platypus.gl` took 1.6 s in a fresh session, then 0.1 s. **[source of 1.3.0; timing tested 1.3.0; not run on a computer without a compiler]**

To move a user from CRAN to the complete 1.3.0 before CRAN has all of it, with dartRverse 1.2.7 or later:

```r
dartRverse_install("all", rep = "Github", branch = "beta")
```

With dartRverse 1.0.6, one call per package, in this order:

```r
for (p in c("dartR.data", "dartR.base", "dartR.popgen", "dartR.spatial", "dartR.sim", "dartR.captive", "dartR.sexlinked"))
  dartRverse_install(p, rep = "Github", branch = "beta")
```

The order is the one version 1.2.7 uses, and dartR.captive comes after the two packages it needs (dartR.popgen and dartR.sim). Use `branch = "dev"` only for a fix that is not on `beta` yet. Neither command was run here. **[source of 1.2.7; DESCRIPTION of 1.3.0; not tested]**

### Results that change when upgrading from CRAN 1.2.x to 1.3.0

A user who reruns an analysis made on CRAN dartR.base 1.2.3 (or 1.2.2 of the other packages) on 1.3.0 gets different numbers from the functions below. Most changes are corrections: the old number was wrong. When a user asks why a result changed after an update, or why a published value cannot be reproduced, check this list and say which version gave which number. Until the 1.3.0 add-ons are on CRAN, CRAN users still get the old behaviour for the dartR.spatial, dartR.captive, dartR.sexlinked and dartR.sim rows. The list is a selection; each package's `NEWS.md` has the rest, for example <https://github.com/green-striped-gecko/dartR.base/blob/beta/NEWS.md>. **[NEWS 1.3.0, unless marked]**

- **`gl.impute(method = "frequency")` and `method = "HW"` mislabel individuals on dartR.base 1.2.3.** The function returns individuals regrouped by population, but copies `pop` and `ind.metrics` across in the original order. On `platypus.gl`, 52 of 81 individuals came back with another individual's population and 77 of 81 with another individual's metadata row; the genotypes still carry the right individual names. Every analysis that uses populations or metadata after imputation is then wrong. Fixed from 1.2.6: on 1.3.0 names and populations came back aligned. On 1.2.3, sort by population first, `x <- x[order(pop(x)), ]`, which was tested and returns everything aligned, and confirm with `identical(indNames(imputed), indNames(x))`. **[tested 1.2.3, 1.2.6 and 1.3.0]**
- **Function arguments.** Between dartR.base 1.2.3 and 1.3.0, 19 of 155 shared functions gained arguments (for example `gl.filter.hwe`, `gl.read.vcf`, `gl.test.heterozygosity`, `gl.tree.nj`, `gl.report.hamming`, `gl.subsample.loc`) and `gl.plot.snp.density` lost `save2tmp`. `gl.amova` moved to dartR.popgen, and `gl.mahal.assign` and `gl.document` are gone. The new functions include `gl.report.contamination`, `gl.filter.contamination`, `gl.report.replicates.KING`, `gl.filter.replicates.KING` and `gl.fbm.cleanup`. An `unused argument` error on a call taken from this reference usually means the user is on the CRAN release. **[tested 1.2.3 and 1.3.0]**

dartR.base:

| Function | What changes |
|---|---|
| `gl.report.fstat()` | Every bootstrap confidence interval: 1.2.3 resampled individuals instead of loci. |
| `gl.fst.pop()` | Theta is computed in dartR.base (same values as StAMPP); the bootstrap is reproducible under `set.seed()`. |
| `gl.fixed.diff()`, `gl.fdsim()` | `mono.rm` is honoured, so `$nloc` and `$pcfd` change (pcfd about five times higher on the test data), and so does `gl.dist.pop(method = "fixed-diff")`; p-values of `test = TRUE` were too small (0.022 became 0.15). |
| `gl.report.heterozygosity()` | uHe and FIS use each locus's own sample size; `Ho.adjSE` and `He.adjSE` were too large; `polyLoc` and `monoLoc` leave out all-missing loci. Population colours were on the wrong populations, here and in seven other functions' plots. |
| `utils.basic.stats()`, behind `gl.report.fstat()` and `gl.diagnostics.hwe()` | Overall Fst and Fis when some loci are absent from some populations. |
| `gl.diagnostics.hwe()` | Standard errors of Fis and Fst were too small by a factor of nLoc − 1. |
| `gl.report.pa()` | Chao1 and Chao2 are computed per pair of populations; `asym` was wrong with several populations. |
| `gl.report.diversity()`, `gl.report.shannon()` | q = 1 values and the q = 1 and q = 2 beta matrices; Shannon beta and gamma were constants and are now one row per population. |
| `gl.dist.pop()` | Distances were attached to the wrong population labels when the levels were not in alphabetical order; `type = "matrix"` returns the full matrix. |
| `gl.dist.ind()` | `method = "sorensen"` was simple matching; Simple and Absolute no longer depend on which allele is the reference; Bray-Curtis on presence/absence fell back to simple matching. |
| `gl.tree.nj()`, `gl.tree.fitch()` | The default NJ tree changes on any data with missing genotypes; `method = "UPGMA"` silently gave an NJ tree; Fitch bootstrap supports were read from the wrong edges. |
| `gl.test.heterozygosity()` | Significance labels are two-sided at `alpha`; they were at twice the stated level. |
| `gl.report.monomorphs()`, `gl.report.hamming()` | Return their input and a table respectively (section 3). |
| `gl.filter.hamming()` | `threshold` is a count of bases, not a proportion (section 4). |
| `gl.filter.maf()`, `gl.filter.pa()`, `gl.allele.freq()` | Boundary rules of the MAF filter; SilicoDArT frequencies were halved (`gl.filter.pa()` kept 45 loci where it now keeps 66 on the test data). |
| `gl.filter.secondaries(method = "best")`, `gl.filter.factorloadings(retain = TRUE)` | Now do what the help page says; both returned something else on 1.2.3. |
| `gl.filter.replicates()`, `gl.report.replicates()` | A tied pair loses one member, not both. |
| `gl.report.hwe()`, `gl.filter.hwe()` | Which populations are skipped no longer depends on `verbose` (on one dataset 30 populations were tested at `verbose = 0` and 23 at `verbose = 2`). |
| `rbind()`, `gl.sample()`, `gl.subsample.ind()` | `rbind()` matches loci by name (section 1); seeded subsamples change, and by-population upsampling drew one copy too many. |
| `gl.read.dart()` | `@position` is left empty (section 6). |
| `gl.read.vcf()` | Half-missing calls (`0/.`) are `NA`, not heterozygous; INFO fields are parsed by key (metrics were swapped); individuals missing from `ind.metafile` are kept. |
| `gl.read.PLINK()`, `gl.read.csv()`, `gl.read.fasta()` | Genotypes are returned at the default verbosity (section 2); PLINK metadata rows are matched by `id`, not by file order. |
| `gl2eigenstrat()`, `gl2gds()` | The eigenstrat genotype file holds 2 minus the dartR score; `gl2gds()` gave most records another locus's position. |
| `gl.sim.genotypes()`, `gl.sim.crosses()` | `n.ind` is per population; data simulated with `gl.sim.crosses()` on earlier versions should be regenerated. |
| `gl.plot.heatmap()`, `gl.map.interactive()` | A matrix is drawn as supplied (the diagonal and one triangle were lost); map links joined the wrong individuals. |

dartR.popgen:

| Function | What changes |
|---|---|
| `gl.outflank()` | Each SNP is analysed once: outlier counts were doubled. |
| `gl.sfs()`, `gl.run.stairway2()`, `gl.run.epos()` | The spectrum uses only loci scored in every individual (section 5); EPOS scales L to the loci used. |
| `gl.TajimasD()` | `sim_pval` is simulated in R (ms is not needed); D changes slightly with missing data. |
| `gl.LDNe()` | Jackknife intervals were shifted when the first population had fewer than three individuals; bars were mislabelled when the levels were not alphabetical. |
| `gl.nhybrids()` | In `aa-PofZ.csv` every probability sat one column right of its label; SNP data only. |
| `gl.run.structure()` and related | q-matrix rows follow `indNames(x)`; runs are named `k<K>.r<replicate>`; `gl.evanno()` returns `NA` where it returned `Inf`; map bars are drawn at the right population. |
| `gl.check.panel()` | Returns a named list; columns renamed (`he_orig` for `het_orig`). |
| `gl.assign.pa()` and the other `gl.assign.*` | Reviewed versions in dartR.popgen; they behave differently from the dartR.captive 1.2.2 versions (section 9, mixed install). |

dartR.captive:

| Function | What changes |
|---|---|
| `gl.grm()` | Loci whose minor allele occurs once are kept on every computer; values differed between Apple Silicon and others (the diagonal of T27 was 0.943 against 0.986). |
| `gl.grm.network()` | Halves its input unless it is tagged kinship (section 7); the `standardise = TRUE` formula changed. |
| `gl.filter.parent.offspring(method = "best")` | Removed the better-genotyped member of a pair; fewer individuals are removed now. |
| `gl.report.parent.offspring()` | Works on proportions, with new columns `n.loci` and `prop`; p-values are larger. |
| `gl.diagnostics.relatedness()` | Its "RMSE" was the mean absolute error; simulations now mirror the data given. |

`gl.relatedness()`, `gl.inbreeding()`, `gl.parentage.power()`, `gl.test.offspring()` and `gl.report.errorrate()` are new to CRAN users with 1.3.0.

dartR.spatial, dartR.sexlinked and dartR.sim:

| Function | What changes |
|---|---|
| `gl.ibd()`, `gl.spatial.autoCorr()` | Geodesic distances between coordinates; `gl.spatial.autoCorr()` had the sign of r reversed for Simple and Absolute distances, and its default r roughly doubles. |
| `gl.run.eems()` | Coordinates are passed as longitude and latitude with great-circle distances, so every result changes. |
| `gl.genleastcost()`, `gl.costdistances()` | `propShared` is returned as a distance; cost distances change on heterogeneous landscapes. |
| `gl.report.sexlinked()`, `gl.filter.sexlinked()` | Sex is read from `ind.metrics` by row; Fisher's test uses the observed counts, so some loci change category; data with no males came back unfiltered. |
| `gl.infer.sex()` | A tie gives `*?` and an individual without usable genotypes `NA` (both were `*F`); a `system` that did not match `gl.keep.sexlinked()` gave `*F` for everyone. |
| `gl.sim.WF.run()` | Many corrections (migration was halved, the coding of `real_freq` was flipped, selection, recombination, labels with 10 or more populations); rerun the simulations. |
| `gl.diagnostics.sim()` | The expected FST was about half the right value; it returns a list. |
| `gl.sim.emigration()`, `gl.sim.mutate()`, `gl.sim.Neconst()` | Migration ran in the reverse direction; `mut.rate = 0` still mutated; every simulated locus is now polymorphic. |

### Not in 1.3.0, and on `dev` only

- **Functions that were on `dev` for a few days and are not in 1.3.0:** `gl.kin()`, `gl.select.pairs()` and eleven captive-management reports (`gl.report.gd.projection`, `gl.report.ind.add`, `gl.report.ind.move`, `gl.report.ind.remove`, `gl.report.kin.classes`, `gl.report.kin.confidence`, `gl.report.kin.groups`, `gl.report.kin.sets`, `gl.report.kinship`, `gl.report.mate.suitability`, `gl.report.repro.targets`) in dartR.captive, and `gl.sim.apply()` in dartR.sim. Version 0.5.0 of this skill listed them. Code that calls them fails with `could not find function`. **[NAMESPACE of 1.3.0]**
- **dartR.base 1.3.1 on `dev`** changes `gl.pcoa.plot()`: a new `label.style`, `"star"` by default with five or more populations, with `label.size` 0.6 for it, and individual labels centred on their points. It also converts an object of the retired `dartR` class read with `readRDS()`, with a warning. A user on `dev` sees these; the reference does not. **[NEWS of dev 1.3.1]**

## 10. File-backed objects

A file-backed object keeps its genotypes in a file on disk (slot `@fbm`, a file-backed matrix of the bigstatsr package) and not in memory (slot `@gen`), so that data larger than the computer's memory can be analysed. `gl.read.dart()`, `gl.read.vcf()`, `gl.read.csv()`, `gl.read.PLINK()`, `gl.read.fasta()` and `gl.load()` create one when `fbm = TRUE`. `gl.gen2fbm()` converts an object in memory and `gl.fbm2gen()` converts back. The items below were run on a file-backed copy of `platypus.gl` unless marked otherwise. **[tested 1.3.0]**

- **Use version 1.3.0 or later for file-backed work.** Version 1.3.0 reworked file-backed storage so that functions read the file in blocks, and corrected many file-backed faults of the 1.2.x versions. **[NEWS 1.3.0]** On 1.3.0 `gl.report.heterozygosity()`, `gl.fst.pop()`, `gl.filter.callrate()`, `gl.filter.maf()` and `gl.dist.ind()` gave the same results file-backed as in memory. **[tested 1.3.0]** For data that fit in memory, `fbm = FALSE` remains the simpler choice.
- **The genotypes are written to the folder `getOption("FBM.dir")`, which is R's temporary folder for the session unless you set it.** That folder is deleted when the session ends. Every subset or filter of a file-backed object writes another file there: `x[1:10, ]`, `gl.keep.pop()` and `gl.filter.callrate()` each added one. Files of objects that no longer exist are deleted at garbage collection (three of six went after `rm()` and `gc()`); `gl.fbm.cleanup()` reports what is still in use. A long script on large data needs disk space there, so point `options(FBM.dir = )` at a disk with room. **[tested 1.3.0]** A chain of filters has left all its intermediate files behind on 1.3.0. **[developer note]**
- **`saveRDS()` saves a pointer to that file, not the genotypes.** In the next session the object loads and `nInd()` and `nLoc()` answer, but the first function that reads genotypes stops with `Error when mapping file: No such file or directory`. `gl.load()` on such a file stops with a message that names the cause. Save with `gl.save()`, which stores the genotypes; `gl.load()` then returns the object complete, in memory. **[tested 1.3.0]**
- **To keep the file between sessions, name it.** `gl.gen2fbm(x, backingfile = "data/geno")` writes `data/geno.bk`; a named file is never removed automatically, and an object saved with `saveRDS()` then reloads for as long as that file stays where it is. Subsets and filters of the object still go to `getOption("FBM.dir")`. **[tested 1.3.0]**
- **`gl.pcoa()` now gives the same answer file-backed and in memory.** On 1.3.0 both fill a missing genotype with the locus mean: the first axis explained 7.04% of the variance in both, and the eigenvalues agreed within 0.1%. On 1.2.6 the file-backed version imputed from the nearest neighbour first and gave 7.87%. **[tested 1.3.0 and 1.2.6]**
- **Only diploid SNP data can be file-backed.** `gl.gen2fbm()` on a SilicoDArT object stops with `Only SNP data can be converted to FBM at this time`. **[tested 1.3.0]** Ploidy or genotype values above 2 are refused as well. **[NEWS 1.3.0]**
- **Some functions still need the whole genotype matrix in memory.** `gl.relatedness()`, `gl.parentage.power()`, `gl.opt.ind.all()`, `gl.impute(method = "beagle")` and `gl.dist.phylo()` decode it, and the first three stop when it would exceed `getOption("dartR_fbm_max_decode_gb", 4)` GB. **[NEWS 1.3.0]** `gl.sim.crosses()` and `gl.sim.genotypes()` return in-memory objects from file-backed input. **[developer note]**
- **Large files can be read straight to disk.** With `fbm = TRUE`, `gl.read.dart()` and `gl.read.PLINK()` (from a `.bed` file) write the genotypes into the backing file as they read, and `gl.read.vcf(parser = "cpp")` does the same through the tidypopgen package, which the user installs. The `"cpp"` parser reads diploid SNP genotypes only: it skips indels and gives no read depth, read counts or likelihoods. **[help; NEWS 1.3.0; `gl.read.dart(fbm = TRUE)` tested 1.3.0]**
