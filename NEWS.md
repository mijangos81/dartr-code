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
