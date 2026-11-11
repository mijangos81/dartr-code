---
name: dartr-code
description: Write, fix or review dartR/dartRverse R code for SNP data (gl.* functions, genlight objects, DArT, DArTseq or SilicoDArT reports). Covers the dartRverse population-genetics packages (dartR.base, dartR.popgen, dartR.spatial, dartR.captive, dartR.sexlinked, dartR.sim) and the retired dartR package. Use whenever a request or a script mentions library(dartRverse), library(dartR), a gl.* function such as gl.read.dart, gl.filter.callrate, gl.report.heterozygosity, gl.pcoa or gl.fst.pop, or a genlight object, and whenever the user wants to filter SNPs, run a PCA or PCoA, or estimate FST, heterozygosity, relatedness, population structure or Ne from SNP data in R, even if no package is named. Supplies the exact signature of every function and the known traps that make dartR code run without error and return a wrong result.
metadata:
  version: "0.5.0"
---

# Writing dartRverse code

Two things go wrong when dartRverse code is written from memory.

- **Names are misremembered.** The suite exports 263 functions. Argument names changed when the old `dartR` package was split into the dartRverse, and they are still not uniform: most functions take `plot.display`, but `gl.pcoa` takes `plot.out`. A wrong name stops the user's script, and they often cannot tell why.
- **Some calls run and are wrong.** Nothing errors and the numbers look plausible, so the mistake travels into a thesis or a management decision. These are the traps listed below.

So look up every function you call, and read the traps for the kind of work you are doing. Do what was asked: a one-line fix does not need an analysis pipeline built around it, and the user's own instructions take precedence over the defaults in this skill.

## Look up every function before you call it

`scripts/` and `references/` are inside this skill's folder, beside this file, not in the user's working directory. Which of them you use depends on what this session can do.

**If you can run R and the dartR packages are installed in it**, ask them. The answer is exact for that installation:

```bash
Rscript /path/to/dartr-code/scripts/dartr_ref.R help gl.filter.callrate gl.pcoa   # signature, arguments, return value
Rscript /path/to/dartr-code/scripts/dartr_ref.R find heterozygosity               # search function names and titles
Rscript /path/to/dartr-code/scripts/dartr_ref.R versions                          # which dartR.* versions are installed
```

Replace `/path/to/dartr-code` with this skill's folder. Use the R installation that holds the dartRverse; the script says so if that R has none. When that R is not the user's own (a sandbox or a server), compare its versions with theirs before treating its answer as theirs. The script's `build` and `migration` commands rewrite the reference files; they are for maintaining the skill, not for looking a function up.

**If you cannot**, read the static reference in `references/`. Being able to run Python does not mean R is available. Open `index.md` (one line per function), then the file it names. Each function is a `### name` heading; search for the heading and read that block rather than the whole file.

| File | Contents |
|---|---|
| [index.md](references/index.md) | Every function, one line each, grouped by the files below |
| [dartRverse.md](references/dartRverse.md) | `dartRverse_install`, `gl.download.binary` |
| [base-read-save.md](references/base-read-save.md) | `gl.read.*`, `gl.load`, `gl.save` |
| [base-report.md](references/base-report.md), [base-filter.md](references/base-filter.md) | `gl.report.*` and `gl.filter.*` |
| [base-manage.md](references/base-manage.md) | Subset, recode, rename, join, impute, recalculate |
| [base-analyse.md](references/base-analyse.md) | Distances, PCoA, FST, trees, HWE, plots, maps |
| [base-convert.md](references/base-convert.md), [base-utils.md](references/base-utils.md) | `gl2*` exporters; `utils.*` helpers |
| [popgen-structure.md](references/popgen-structure.md), [popgen-demography.md](references/popgen-demography.md), [popgen-other.md](references/popgen-other.md) | dartR.popgen |
| [spatial.md](references/spatial.md), [captive.md](references/captive.md), [captive-report.md](references/captive-report.md), [sexlinked.md](references/sexlinked.md), [sim.md](references/sim.md) | The other packages |
| [migration-from-dartR.md](references/migration-from-dartR.md) | What changed from the old `dartR` package |
| [traps.md](references/traps.md) | All known traps, by topic |
| [resources.md](references/resources.md) | The ebook, the workshop tutorials and the user forum: which page covers which analysis |

**If you cannot read those files either**, read the function's help page or source in its package repository under <https://github.com/green-striped-gecko>, at the user's release when you know it. Failing that, ask the user to paste `args(fn)` and `packageVersion("dartR.base")`. Do not write a signature from memory and present it as checked.

Three rules follow from this.

1. Do not invent a function or an argument. One that the lookup does not find may be missing because its package is not installed or because the user's release differs, so check the package and the version first. If it still is not there, say so and offer the nearest real one. An invented argument fails with `unused argument`, and an invented function sends the user searching for something that was never there.
2. Code recalled from memory or copied from an old script is probably written for the old `dartR`. Check it against `migration-from-dartR.md`.
3. Each reference file states the package versions it was built from. They are the `dev` branches (dartR.* 1.2.6), which are ahead of CRAN, so do not present the static files as the CRAN release. A user on other versions may see different arguments: ask them to run `packageVersion("dartR.base")` when it matters, and trust `args(fn)` in their session over the static file. The CRAN releases also contain faults that the `dev` branches have corrected, some of which give a wrong number without an error; they are listed in `traps.md`, section 9.

## Setup

Writing or reviewing code does not require changing the user's R library. Find out what is installed first, and install or update only when the user asks for it or a needed package is missing. Then use these lines:

```r
install.packages("BiocManager")
BiocManager::install(c("SNPRelate", "snpStats", "LEA"))  # not on CRAN: two for dartR.base, LEA for dartR.popgen
install.packages("dartRverse")                      # the umbrella package only: no gl.* functions yet
install.packages("dartR.base")                      # the gl.* functions; brings dartR.data with it
library(dartRverse)                                 # attaches every dartR.* package that is installed
dartRverse_install()                                # installed versions beside those on CRAN and GitHub
dartRverse_install("dartR.popgen", rep = "CRAN")    # add another package, one per call
```

These lines avoid the parts of `dartRverse_install()` that changed between releases: what `"all"` does, and what happens to a `branch` given without `rep = "Github"`, depend on the dartRverse version, and installing from CRAN replaces a newer GitHub version with the older release. Read `traps.md`, section 9, before writing any other install or update command.

Never write `library(dartR)` or `install.packages("dartR")`: that package is retired.

For a runnable example when the user gives no data, use the bundled objects `platypus.gl` (81 individuals, 1,000 loci, 3 populations), `testset.gl`, `bandicoot.gl` or `possums.gl`. Raw DArT example files are at `system.file("extdata", "testset_SNPs_2Row.csv", package = "dartR.data")` and `testset_metadata.csv` in the same folder.

## The genlight object

Most `gl.*` functions work on a genlight object (class `dartR`): individuals in rows, loci in columns. The readers take files, and a few functions take a matrix or a distance object, so check the signature.

- **Genotypes.** SNP data: `0` homozygous reference, `1` heterozygous, `2` homozygous alternate, `NA` missing. SilicoDArT data: `1` present, `0` absent. `as.matrix(x)` gives the matrix. Sixty-eight functions stop when given a SilicoDArT object; the reference marks each one with a **Data: SNP only** line.
- **Accessors.** `nInd(x)`, `nLoc(x)`, `nPop(x)`, `indNames(x)`, `locNames(x)`, `pop(x)`, `popNames(x)`.
- **Metadata.** `x@other$ind.metrics` (one row per individual, in the object's order), `x@other$loc.metrics` (one row per locus), `x@other$latlon` (columns `lat`, `lon`), `x@other$history` (the calls that built the object).
- **Subsetting.** `x[i, j]` and the `gl.keep.*` / `gl.drop.*` functions keep those tables in step with the genotypes. They do not recalculate the locus statistics; see trap 6.
- **File-backed objects.** With `fbm = TRUE` a reader keeps the genotypes in a file in R's temporary folder (`x@fbm`) and not in memory. Use it only for data too large for memory, and save such an object with `gl.save()`: `saveRDS()` stores a pointer to a file that is gone in the next session. Read `references/traps.md`, section 10, before writing code for one.

Attach anything to individuals **by name, never by position**: `pop(x) <- sheet$pop[match(indNames(x), sheet$id)]`. Before that line, check that the IDs in the sheet are unique and that every `indNames(x)` is among them; after it, check the result for `NA`. Sample sheets are rarely in the object's order.

## Order of work

1. **Read.** `gl.read.dart(filename = , ind.metafile = )` for DArT reports, `gl.read.vcf()` for VCF. The metadata CSV needs an `id` column matching the sample names in the data file exactly; `pop`, `lat` and `lon` columns fill `pop(x)` and `x@other$latlon`. Then compare `nInd(x)` with the number of samples you expected (trap 5).
2. **Report, then filter.** Each `gl.filter.X` has a `gl.report.X`. Run the report, choose the threshold from what it shows, and state the threshold and how many loci or individuals it removed. A threshold copied from another study is a guess about this dataset.
3. **Usually loci before individuals for call rate.** An individual's call rate is the share of the *retained* loci that were scored, so filtering individuals against thousands of poor loci discards good samples. The order is a choice between keeping loci and keeping individuals, so say which you chose. The developers' suggested starting sequence (sex-linked loci, read depth, reproducibility, call rate by locus, call rate by individual, secondaries, monomorphs) is in `references/resources.md`, section 1.
4. **After removing individuals or populations**, pass `recalc = TRUE, mono.rm = TRUE`, or call `gl.recalc.metrics()` and `gl.filter.monomorphs()` (trap 6).
5. **`set.seed()` before anything random**: `gl.filter.secondaries(method = "random")`, subsampling, imputation, bootstraps, simulations.
6. **Say which analysis each filter is for.** A filter that helps one analysis biases another: a MAF filter distorts the site frequency spectrum and Tajima's D, and HWE should be tested within populations (`gl.filter.hwe(subset = "each")`, the default), because pooling populations flags loci that merely differ between them.

## Traps: code that runs and is wrong

Each was reproduced on dartR.base 1.2.6 with the bundled data when this skill was written. That is the skill's evidence, not a test run in your session, so do not report it as one of yours. `references/traps.md` has more, grouped by topic, including relatedness and kinship scales, LD, sex-linked loci, contamination and batch effects, file-backed objects, results that differ on the CRAN release, and how to download and call the external programs (STRUCTURE, NeEstimator, COLONY and others) with `gl.download.binary()`. Read the relevant section before writing that kind of analysis.

1. **`verbose = 0` also turns off plots**, even with `plot.display = TRUE`, and so does `gl.set.verbosity(0)`. Use `verbose = 1` when the user needs the figure.
2. **Report functions do not return the same kind of object.** `gl.report.callrate` returns the genlight; `gl.report.heterozygosity` returns a data frame; `gl.report.fstat` returns a list. Writing `x <- gl.report.heterozygosity(x)` replaces the data with a table. Read **Returns** in the reference.
3. **`plot.file` saves an `.RDS` holding the ggplot object, not an image.** For a figure: `p <- readRDS(file.path(dir, "name.RDS")); ggplot2::ggsave("name.png", p)`.
4. **`gl.keep.ind()` returns individuals in the object's order, not the order of `ind.list`.** Labels assigned by position afterwards land on the wrong individuals. Assign by name.
5. **`gl.read.dart()` drops every sample that has no row in the metadata file**, without an error. Give every sample a row.
6. **Subsetting leaves stale statistics and monomorphic loci.** Keeping one of the three `platypus.gl` populations with the defaults leaves 513 of 1,000 loci monomorphic or entirely missing, and `loc.metrics$CallRate` unchanged.
7. **`gl.impute()` imputes within each population as set in `pop(x)`.** Imputing with `pop` set to the grouping you then plot makes those groups look more distinct than the data support. Impute on a neutral grouping. Loci missing in every individual stay `NA`, so run `gl.filter.allna()` first. On dartR.base 1.2.3 and earlier this function also mislabels individuals; see `traps.md`.
8. **`gl.filter.maf(threshold = 3)` is a minor allele count, not a frequency.** A value above 1 is converted to `threshold / (nInd * ploidy)`. Say which one you used.
9. **There are two FSTs.** `gl.fst.pop()` gives Weir and Cockerham's (1984) theta; `gl.report.fstat()` gives Nei's (1987) Fst and Fstp, Jost's D and Hedrick's Gst. They differ on unevenly sampled data, so name the estimator. `gl.fst.pop()` returns a lower-triangle matrix, and a list instead when `nboots > 1`.
10. **`x@position` is the SNP's position inside its sequence tag and `x@chromosome` is empty after `gl.read.dart()`.** Genome coordinates sit in `loc.metrics` columns named after the reference genome. Functions that use map positions need them copied across first:
    ```r
    chr <- "Chrom_Platypus_Chrom_NCBIv1"      # the names in platypus.gl: use the two
    pos <- "ChromPos_Platypus_Chrom_NCBIv1"   # Chrom_* columns of your own loc.metrics
    stopifnot(c(chr, pos) %in% names(x@other$loc.metrics))
    chromosome(x) <- as.factor(x@other$loc.metrics[[chr]])
    position(x)   <- as.integer(x@other$loc.metrics[[pos]])
    ```

## Tutorials and the forum

`references/resources.md` maps each kind of analysis to a chapter of the dartRverse ebook or a workshop tutorial, and says how to send a user to the dartR Google Group with a post the developers can act on. Read the mapped page before writing an analysis that is new to you, and give the user the specific page when they need the reasoning and not only the code. Tutorial code is not always current: 50 of the 799 dartR calls in those pages do not match the 1.2.6 signatures, so check each call you borrow.

## What to hand back

For an analysis, give a script that runs from `library(dartRverse)` to the result in a fresh session, because the user has to be able to rerun and defend it later. Put thresholds in named variables with the reason beside them, set the seed, and end with `sessionInfo()` so the package versions are on record. If a bundled dataset stood in for the user's data, say that the numbers are an example and not their result.

For a fix, a review or an explanation, give the change or the answer that was asked for, with the checks that bear on it.

In both cases say what you did: which code you ran, which calls you checked against the installed packages, and which against the static reference. Say what you could not run and what was missing. Do not report a number or a check that you did not produce.
