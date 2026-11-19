# dartr-code 0.6.0 (19 November 2026)

The reference now describes dartRverse 1.3.0, the release submitted to CRAN,
instead of the 1.2.6 development branches. dartR.base 1.3.0 and dartR.popgen
1.3.0 reached CRAN on 18 November 2026; the other four packages there are
still 1.2.2.

- **Function reference.** Rebuilt from the `beta` branches (dartR.* 1.3.0,
  dartRverse 1.3.0) installed in a separate library: 268 functions. New:
  `gl.fbm.cleanup`, `gl.test.offspring`, `gl.report.errorrate`,
  `download_binary` and 15 `utils.fbm.*` helpers. `gl.He`, `gl.Ho` and
  `gl.propShared` are back in dartR.base. No longer exported: `gl.kin`,
  `gl.select.pairs`, eleven captive-management reports and `gl.sim.apply`,
  which were on `dev` when 0.5.0 was built. `migration-from-dartR.md` was
  regenerated.
- **`traps.md`, re-tested.** Every item tagged as tested on 1.2.6 was run
  again on 1.3.0. Most held. These changed:
  - `gl.read.dart()` now leaves `@position` and `@chromosome` empty; the
    bundled `platypus.gl` still carries the old tag positions (section 6, and
    trap 10 in `SKILL.md`).
  - `gl.pcoa()` gives the same result file-backed and in memory.
  - `gl.impute(method = "frequency")` is deterministic apart from the
    residual fill, which still needs a seed.
  - Report functions still print their tables at `verbose = 1`.
  - `gl.read.csv()` keeps its genotypes at the default verbosity.
- **`traps.md`, new items.** `gl2plink()` writes round positions as `1e+05`
  (workaround tested). `gl.report.nall()` is not reproducible under
  `set.seed()`. The readers count different alleles. `gl.filter.hamming()`
  takes a count. `gl.relatedness()` needs the `dartR_coancestry` program. On
  a mixed CRAN install, dartR.captive 1.2.2 masks the reviewed `gl.assign.*`
  of dartR.popgen 1.3.0. On R 4.4, `install.packages()` installed binaries
  years out of date.
- **`traps.md`, section 9, rewritten.** It has the version table for
  19 November 2026, install commands for the complete 1.3.0 from `beta`, and
  a list of the results that change when a user moves from CRAN 1.2.2/1.2.3
  to 1.3.0. That list was taken from the packages' change logs and checked
  against them, not run.
- **Section 10 (file-backed objects).** Rewritten for 1.3.0: the backing
  folder `getOption("FBM.dir")`, automatic deletion, `gl.fbm.cleanup()`, the
  limit on decoding the whole matrix, and readers that write straight to
  disk.
- **Website.** The function tree has 231 functions in 18 groups: the
  captive-management group is gone with its functions.

# dartr-code 0.5.0 (11 November 2026)

The one skill folder now serves Claude, Codex and the ChatGPT desktop app.

- **Packaging.** `plugin.json` at the repository root makes the repository a
  portable plugin, and `skills/dartr-code/agents/openai.yaml` gives Codex and
  ChatGPT a display name and a default prompt. Neither file affects Claude.
- **`SKILL.md`, working with and without R.** The lookup section now covers
  three cases: R with the dartR packages, the static reference only, and
  neither. It says that the skill's files sit beside `SKILL.md` and not in the
  user's working directory, and that an R that is not the user's own may hold
  other versions.
- **`SKILL.md`, scope and reporting.** Do what was asked (a fix does not need a
  pipeline), do not change the user's R library unless asked, and report which
  code was run and which calls were only checked against the reference.
- **Description.** Its opening words now name dartR, dartRverse and SNP data.
  With 177 skills installed, Codex showed the model only the first 56
  characters or so of each description.
- **Corrections.** "Every `gl.*` function works on a genlight object" became
  "most", because readers take files. The code under trap 10 is now valid R and
  checks that the two columns exist.

The reference files and the lookup script are unchanged.

# dartr-code 0.4.0 (11 November 2026)

Additions to `skills/dartr-code/references/traps.md`:

- **Section 10, file-backed objects (new).** `saveRDS()` on a file-backed
  object saves a pointer to a temporary file and not the genotypes; `gl.pcoa()`
  gives different numbers for file-backed and in-memory copies of the same data
  when genotypes are missing; where the backing files go and how to keep one.
- **Section 9, faults in the CRAN releases.** Eleven functions that return a
  wrong result without an error on the CRAN releases and are corrected on
  `dev`, among them three readers that return an object with no genotypes.
  Each was read in the CRAN source and in the `dev` change log.
- **Section 9, compiler.** The functions that compile C++ when they are first
  called, and so need Rtools or the Xcode command line tools.
- **Section 7, `gl.grm.network()`.** Whether the function halves its input
  depends on the version of dartR.captive, and on 1.2.6 on a tag that is lost
  when the matrix is subset.
- **Sections 1, 2, 4 and 6.** Plain names for individuals and populations; the
  DArT order and plate columns in `ind.metrics`; screening for contamination
  before removing replicates; which reference genome to cite.

Function reference:

- A **Data** line marks the 68 functions that accept SNP data only and the one
  that accepts SilicoDArT data only, and `index.md` carries the same mark. The
  line is read from each function's input check, and each of the 69 was called
  with the other data type to confirm that it stops. `dartr_ref.R help` prints
  the same line for the installed version.

`SKILL.md` points to the new sections.

# dartr-code 0.3.0 (10 November 2026)

First public version.
