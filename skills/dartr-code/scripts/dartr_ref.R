#!/usr/bin/env Rscript
# dartr_ref.R -- exact dartRverse function reference, read from the INSTALLED packages.
#
#   Rscript dartr_ref.R help gl.filter.callrate gl.pcoa   # signature + arguments + value
#   Rscript dartr_ref.R find heterozygosity               # search function names and titles
#   Rscript dartr_ref.R versions                          # installed dartR.* versions
#   Rscript dartr_ref.R build <references-dir>            # regenerate the static reference (maintainers)
#
# Signatures come from formals() of the exported function, so they are exact for
# whatever version is installed. Argument text comes from the package help (.Rd).

PKGS <- c("dartRverse", "dartR.base", "dartR.popgen", "dartR.spatial", "dartR.captive",
          "dartR.sexlinked", "dartR.sim")
COMMON <- c("plot.display", "plot.theme", "plot.colors", "plot.file", "plot.dir", "verbose")

quiet <- function(expr) suppressWarnings(suppressMessages(expr))
installed <- function() PKGS[vapply(PKGS, function(p) quiet(requireNamespace(p, quietly = TRUE)), logical(1))]

# ---- Rd -> plain text -------------------------------------------------------
rd_text <- function(x) {
  tag <- attr(x, "Rd_tag")
  if (is.character(x)) return(if (identical(tag, "COMMENT")) "" else paste(x, collapse = ""))
  if (!is.null(tag)) {
    if (tag %in% c("\\dots", "\\ldots")) return("...")
    if (tag == "\\item" && length(x) == 2)
      return(paste0(" - ", rd_text(x[[1]]), ": ", rd_text(x[[2]])))
    if (tag == "\\item" && length(x) == 0) return(" - ")
    if (tag == "\\href" && length(x) == 2) return(rd_text(x[[2]]))
    if (tag %in% c("\\figure", "\\if", "\\ifelse", "\\Sexpr")) return("")
  }
  paste(vapply(x, rd_text, character(1)), collapse = "")
}
squash <- function(s) trimws(gsub("[[:space:]]+", " ", s))
clip <- function(s, n) if (nchar(s) > n) paste0(substr(s, 1, n - 1), "…") else s
rd_tags <- function(rd) vapply(rd, function(s) { t <- attr(s, "Rd_tag"); if (is.null(t)) "" else t }, character(1))
rd_section <- function(rd, tag) {
  hit <- rd[rd_tags(rd) == tag]
  if (length(hit)) squash(paste(vapply(hit, rd_text, character(1)), collapse = " ")) else ""
}
rd_args <- function(rd) {
  sec <- rd[rd_tags(rd) == "\\arguments"]
  out <- list()
  for (s in sec) for (it in s[rd_tags(s) == "\\item"]) {
    if (length(it) != 2) next
    nms <- trimws(strsplit(squash(rd_text(it[[1]])), ",")[[1]])
    for (n in nms) out[[n]] <- squash(rd_text(it[[2]]))
  }
  out
}

# ---- the catalogue ----------------------------------------------------------
signature_of <- function(name, fn) {
  a <- formals(fn)
  if (is.null(a)) return(paste0(name, "()"))
  parts <- vapply(names(a), function(n) {
    d <- paste(deparse(a[[n]], width.cutoff = 500L), collapse = " ")
    if (identical(d, "")) n else paste0(n, " = ", d)
  }, character(1))
  paste0(name, "(", paste(parts, collapse = ", "), ")")
}

# ---- data type accepted by the input check ----------------------------------
# Most gl.* functions pass their genlight to utils.check.datatype(), which stops
# when the data type is not in `accept`. Those calls are read from the function
# body and tried on the SNP and SilicoDArT example objects of dartR.data, so the
# answer is the one the installed version gives. Only the exclusive cases are
# reported ("SNP only", "SilicoDArT only"): a function that passes both types at
# the check can still stop later, so nothing is claimed for it. "" also when the
# function has no such check or its checks disagree.
datatype_calls <- function(e, acc = list()) {
  if (is.call(e)) {
    fn <- e[[1]]
    nm <- if (is.name(fn)) as.character(fn)
          else if (is.call(fn) && length(fn) == 3 && as.character(fn[[1]])[1] %in% c("::", ":::")) as.character(fn[[3]])
          else ""
    if (identical(nm, "utils.check.datatype")) acc[[length(acc) + 1]] <- e
  }
  if (is.call(e) || is.pairlist(e) || is.expression(e))
    for (i in seq_along(e)) {
      if (identical(e[[i]], quote(expr = ))) next   # empty argument, as in x[i, ]
      acc <- datatype_calls(e[[i]], acc)
    }
  acc
}
.datatype_cache <- new.env()
datatype_pass <- function(accept) {   # character vector, or NULL for the function's default
  key <- if (is.null(accept)) "<default>" else paste(sort(accept), collapse = "+")
  if (!is.null(.datatype_cache[[key]])) return(.datatype_cache[[key]])
  chk <- getExportedValue("dartR.base", "utils.check.datatype")
  one <- function(obj) tryCatch({
    quiet(utils::capture.output(
      if (is.null(accept)) chk(obj, verbose = 0) else chk(obj, accept = accept, verbose = 0)))
    TRUE
  }, error = function(e) FALSE)
  res <- c(SNP = one(getExportedValue("dartR.data", "testset.gl")),
           SilicoDArT = one(getExportedValue("dartR.data", "testset.gs")))
  .datatype_cache[[key]] <- res
  res
}
datatype_of <- function(fn) {
  if (!quiet(requireNamespace("dartR.base", quietly = TRUE)) ||
      !quiet(requireNamespace("dartR.data", quietly = TRUE))) return("")
  tryCatch({
    calls <- datatype_calls(body(fn))
    if (!length(calls)) return("")
    chk <- getExportedValue("dartR.base", "utils.check.datatype")
    res <- lapply(calls, function(cl) {
      a <- match.call(chk, cl)$accept
      v <- if (is.null(a)) NULL else eval(a, baseenv())
      if (!is.null(v) && !is.character(v)) stop("accept is not a literal")
      datatype_pass(v)
    })
    res <- res[vapply(res, any, logical(1))]   # drop checks that take no genlight (dist, matrix, ...)
    if (!length(res)) return("")
    res <- unique(lapply(res, function(r) names(r)[r]))
    if (length(res) != 1) return("")
    if (identical(res[[1]], "SNP")) "SNP only"
    else if (identical(res[[1]], "SilicoDArT")) "SilicoDArT only"
    else ""
  }, error = function(e) "")
}
DATATYPE_NOTE <- c("SNP only" = "A SilicoDArT object stops at the input check.",
                   "SilicoDArT only" = "A SNP object stops at the input check.")

catalogue <- function(pkgs = installed()) {
  out <- list()
  for (p in pkgs) {
    ns <- asNamespace(p)
    ex <- sort(getNamespaceExports(p))
    ex <- ex[!startsWith(ex, ".__")]
    db <- quiet(tools::Rd_db(p))
    alias2rd <- list()
    for (r in db) {
      al <- vapply(r[rd_tags(r) == "\\alias"], function(s) squash(rd_text(s)), character(1))
      for (a in al) if (is.null(alias2rd[[a]])) alias2rd[[a]] <- r
    }
    for (f in ex) {
      fn <- get(f, envir = ns)
      if (!is.function(fn)) next
      rd <- alias2rd[[f]]
      docs <- if (is.null(rd)) list() else rd_args(rd)
      title <- if (is.null(rd)) "" else rd_section(rd, "\\title")
      descr <- if (is.null(rd)) "" else rd_section(rd, "\\description")
      kw <- if (is.null(rd)) character(0) else
        vapply(rd[rd_tags(rd) == "\\keyword"], function(s) squash(rd_text(s)), character(1))
      out[[paste(p, f, sep = "::")]] <- list(
        pkg = p, name = f, fn = fn, title = title, description = descr,
        value = if (is.null(rd)) "" else rd_section(rd, "\\value"),
        details = if (is.null(rd)) "" else rd_section(rd, "\\details"),
        args = names(formals(fn)), docs = docs,
        datatype = datatype_of(fn),
        internal = "internal" %in% kw,
        deprecated = grepl("deprecat", paste(title, descr), ignore.case = TRUE),
        documented = !is.null(rd))
    }
  }
  out
}

family_file <- function(pkg, f) {
  if (pkg == "dartR.popgen") {
    fam <-
      if (grepl("structure|snmf|popcluster|evanno|nhybrids|mongrail", f)) "structure"
      else if (grepl("LDNe|^gl[.]ld[.]|sfs|TajimasD|epos|stairway", f)) "demography"
      else "other"
    return(paste0("popgen-", fam, ".md"))
  }
  if (pkg == "dartR.captive")
    return(if (grepl("^gl[.]report[.]", f)) "captive-report.md" else "captive.md")
  if (pkg != "dartR.base") return(paste0(sub("^dartR[.]", "", pkg), ".md"))
  fam <-
    if (grepl("^gl[.]read[.]|^gl[.](load|save)$|^gl[.]write|^gi2gl$|^gl[.](gen2fbm|fbm2gen)$", f)) "read-save"
    else if (grepl("^gl2", f)) "convert"
    else if (grepl("^gl[.]report[.]", f)) "report"
    else if (grepl("^gl[.]filter[.]", f)) "filter"
    else if (grepl("^gl[.](drop|keep|recode|rename|reassign|define|merge|join|subsample|sample|sort|edit|make|set|recalc|compliance|check|add|select|randomize|impute)([.]|$)", f)) "manage"
    else if (grepl("^utils[.]", f)) "utils"
    else "analyse"
  paste0("base-", fam, ".md")
}

FILE_BLURB <- c(
  "dartRverse.md" = "The umbrella package: install and update the dartR.* packages, and download the external programs some functions need. Its behaviour differs a lot between releases; see `traps.md`, section 9.",
  "base-read-save.md" = "Import data into a genlight object, save and load it.",
  "base-convert.md"   = "Export a genlight object to the input format of another program (gl2*).",
  "base-report.md"    = "Report functions: describe the data. Most return the genlight unchanged, so never assign a filter-style result from them without checking **Returns**.",
  "base-filter.md"    = "Filter functions: remove loci or individuals. Each returns a new genlight; assign the result.",
  "base-manage.md"    = "Subset, recode, rename, merge, impute, recalculate metrics and other object housekeeping.",
  "base-analyse.md"   = "Distances, ordination, FST, fixed differences, trees, HWE, plots, maps and simulations in dartR.base.",
  "base-utils.md"     = "Low-level helpers (utils.*). Mostly called by gl.* functions; call directly only when a gl.* function does not do the job.",
  "popgen-structure.md"  = "dartR.popgen: population structure and admixture. Most are wrappers that need an external program (STRUCTURE, fastStructure, PopCluster, NewHybrids) or an extra R package (LEA for sNMF).",
  "popgen-demography.md" = "dartR.popgen: effective population size, linkage disequilibrium, site frequency spectrum, Tajima's D, demographic history (NeEstimator, Stairway Plot 2 and Epos are external programs).",
  "popgen-other.md"      = "dartR.popgen: assignment, outlier loci, AMOVA, marker-panel selection, BLAST and gene annotation.",
  "spatial.md"   = "dartR.spatial: isolation by distance, least-cost paths, spatial autocorrelation, EEMS.",
  "captive.md"   = "dartR.captive: relatedness, kinship, inbreeding, parentage (COLONY and EMIBD9 are external programs).",
  "captive-report.md" = "dartR.captive: reports for managing a captive or small population (kinship classes, mate suitability, adding and removing individuals).",
  "sexlinked.md" = "dartR.sexlinked: identify, filter and use sex-linked loci.",
  "sim.md"       = "dartR.sim: simulate genlight objects and population dynamics.")

entry_md <- function(e, clip_arg = 260, clip_val = 320) {
  flags <- c(if (e$deprecated) "DEPRECATED", if (e$internal) "internal", if (!e$documented) "no help page")
  head <- paste0("### ", e$name, if (length(flags)) paste0("  [", paste(flags, collapse = ", "), "]") else "")
  lines <- c(head, "", if (nzchar(e$title)) c(e$title, ""), "```r", signature_of(e$name, e$fn), "```")
  # 'verbose' is left out only where it means the usual 0-5 verbosity level
  odd_verbose <- "verbose" %in% e$args && !is.null(e$docs[["verbose"]]) &&
    !grepl("^verbos", e$docs[["verbose"]], ignore.case = TRUE)
  for (a in setdiff(e$args, if (odd_verbose) setdiff(COMMON, "verbose") else COMMON)) {
    d <- e$docs[[a]]
    lines <- c(lines, paste0("- `", a, "`: ", if (is.null(d)) "(not documented in the help page)" else clip(d, clip_arg)))
  }
  if (nzchar(e$datatype))
    lines <- c(lines, paste0("- **Data:** ", e$datatype, ". ", DATATYPE_NOTE[[e$datatype]]))
  if (nzchar(e$value)) lines <- c(lines, paste0("- **Returns:** ", clip(e$value, clip_val)))
  c(lines, "")
}

versions_line <- function(pkgs = installed())
  paste(vapply(pkgs, function(p) paste(p, as.character(utils::packageVersion(p))), character(1)), collapse = ", ")

build <- function(dir) {
  dir.create(dir, recursive = TRUE, showWarnings = FALSE)
  cat_all <- catalogue()
  files <- vapply(cat_all, function(e) family_file(e$pkg, e$name), character(1))
  stamp <- paste0("Generated by `scripts/dartr_ref.R build` on ", format(Sys.Date()),
                  " from: ", versions_line(), ". Do not edit by hand.")
  # common arguments, described once
  rep_e <- cat_all[["dartR.base::gl.report.callrate"]]
  common_md <- c("## Arguments shared by most functions", "",
    "These appear in the signatures below but are described only here.", "",
    vapply(COMMON, function(a) paste0("- `", a, "`: ", if (is.null(rep_e$docs[[a]])) "" else rep_e$docs[[a]]), character(1)), "")
  for (f in unique(files)) {
    es <- cat_all[files == f]
    pk <- es[[1]]$pkg
    out <- c(paste0("# ", pk, " — ", sub("[.]md$", "", sub("^base-", "", f)), " (", length(es), " functions)"), "",
             FILE_BLURB[[f]], "", stamp, "",
             "Each function is a `### name` heading: search for the heading and read that block instead of the whole file.", "",
             "A **Data** line marks a function whose input check accepts only one of the two data types, SNP or SilicoDArT (presence/absence). A function without that line is not shown to accept both: it passes both at the check, or has no check, and can still stop later, so read its help text before using it on presence/absence data.", "",
             "**Contents:** ", paste(vapply(es, function(e) e$name, character(1)), collapse = ", "), "",
             common_md, "## Functions", "",
             unlist(lapply(es, entry_md)))
    writeLines(out, file.path(dir, f), useBytes = TRUE)
  }
  # index
  idx <- c("# dartRverse function index", "", stamp, "",
           "One line per exported function. Find the function here, then open the file named in the heading and read its `### name` block for the exact signature and arguments.", "",
           "**[SNP only]** marks a function that stops when it is given SilicoDArT (presence/absence) data, and **[SilicoDArT only]** the reverse. No mark does not mean that both are supported; see the function's block.", "")
  for (f in unique(files)) {
    es <- cat_all[files == f]
    idx <- c(idx, paste0("## ", es[[1]]$pkg, " — `", f, "`"), "", FILE_BLURB[[f]], "",
             vapply(es, function(e) paste0("- `", e$name, "` — ", clip(e$title, 110),
                                           if (e$deprecated) " **[deprecated]**" else "",
                                           if (nzchar(e$datatype)) paste0(" **[", e$datatype, "]**") else ""), character(1)), "")
  }
  writeLines(idx, file.path(dir, "index.md"), useBytes = TRUE)
  # QA: arguments in formals but not in the help page, and the reverse
  qa <- c()
  for (e in cat_all) {
    if (!e$documented) { qa <- c(qa, paste0(e$pkg, "::", e$name, ": no help page")); next }
    undocumented <- setdiff(e$args, c(names(e$docs), "..."))
    stale <- setdiff(names(e$docs), c(e$args, "..."))
    if (length(undocumented)) qa <- c(qa, paste0(e$pkg, "::", e$name, ": in function, not in help: ", paste(undocumented, collapse = ", ")))
    if (length(stale)) qa <- c(qa, paste0(e$pkg, "::", e$name, ": in help, not in function: ", paste(stale, collapse = ", ")))
  }
  cat(sprintf("Wrote %d functions from %d packages to %s (%d files)\n", length(cat_all), length(installed()), dir, length(unique(files)) + 1))
  cat("QA: help/function mismatches:", length(qa), "\n")
  invisible(qa)
}

# Differences between the retired monolithic 'dartR' package and the dartRverse.
# Needs the old 'dartR' installed alongside; maintainers only.
migration <- function(file) {
  if (!quiet(requireNamespace("dartR", quietly = TRUE))) { cat("The old 'dartR' package is not installed; nothing written.\n"); return(invisible()) }
  old_ns <- asNamespace("dartR")
  old <- sort(getNamespaceExports("dartR")); old <- old[!startsWith(old, ".__")]
  old <- old[vapply(old, function(f) is.function(get(f, envir = old_ns)), logical(1))]
  new <- catalogue()
  new_names <- vapply(new, function(e) e$name, character(1))
  new_pkg <- vapply(new, function(e) e$pkg, character(1))
  RENAMED <- c(plot.out = "plot.display", plot_theme = "plot.theme", plot_colors = "plot.colors", save2tmp = "plot.file / plot.dir")
  gone <- setdiff(old, new_names)
  changed <- c(); style <- c()
  for (f in intersect(old, new_names)) {
    e <- new[[which(new_names == f)[1]]]
    a_old <- names(formals(get(f, envir = old_ns))); a_new <- e$args
    removed <- setdiff(a_old, a_new); added <- setdiff(a_new, a_old)
    keeps_old_style <- intersect(a_new, names(RENAMED))
    if (length(keeps_old_style)) style <- c(style, paste0("- `", f, "`: ", paste0("`", keeps_old_style, "`", collapse = ", ")))
    removed_other <- setdiff(removed, names(RENAMED))
    added_other <- setdiff(added, c("plot.display", "plot.theme", "plot.colors", "plot.file", "plot.dir"))
    if (length(removed_other) || length(added_other))
      changed <- c(changed, paste0("- `", f, "` (", e$pkg, ")",
        if (length(removed_other)) paste0(" — removed: ", paste0("`", removed_other, "`", collapse = ", ")) else "",
        if (length(added_other)) paste0(" — new: ", paste0("`", added_other, "`", collapse = ", ")) else ""))
  }
  out <- c("# Moving code from the old `dartR` package to the dartRverse", "",
    paste0("Generated by `scripts/dartr_ref.R migration` on ", format(Sys.Date()), " by comparing dartR ",
           as.character(utils::packageVersion("dartR")), " with: ", versions_line(), ". Do not edit by hand."), "",
    "The monolithic `dartR` package is retired. Most assistants learned dartR from code written for it, so code recalled from memory tends to use its function and argument names. This file lists what changed.", "",
    "## 1. Load the suite, not the old package", "",
    "Replace `library(dartR)` with `library(dartRverse)`. It attaches dartR.base and dartR.data plus every other dartR.* package that is installed.", "",
    "## 2. Plot arguments were renamed in most functions", "",
    "| Old `dartR` | dartRverse |", "|---|---|",
    vapply(names(RENAMED), function(n) paste0("| `", n, "` | `", RENAMED[[n]], "` |"), character(1)), "",
    "`save2tmp = TRUE` saved the plot to the session temporary directory. The replacement saves only when `plot.file` is given, as an `.RDS` file holding the ggplot object in `plot.dir`.", "",
    "The renaming is not complete. These functions still use an old-style name, so read the signature rather than assuming:", "",
    style, "",
    paste0("## 3. Functions of the old package that the dartRverse does not export (", length(gone), ")"), "",
    "Calling one of these fails with `could not find function`. Search `index.md` for the replacement; if none is listed, say so instead of guessing a name.", "",
    paste0("`", gone, "`", collapse = ", "), "",
    paste0("## 4. Functions whose other arguments changed (", length(changed), ")"), "",
    "Plot-argument renames from section 2 are left out. An argument listed as removed raises `unused argument` if passed.", "",
    changed, "")
  writeLines(out, file, useBytes = TRUE)
  cat(sprintf("Wrote %s: %d old functions absent, %d with changed arguments, %d keep an old-style plot argument\n", file, length(gone), length(changed), length(style)))
}

help_cmd <- function(names) {
  cat_all <- catalogue()
  for (n in names) {
    hit <- cat_all[vapply(cat_all, function(e) identical(e$name, n), logical(1))]
    if (!length(hit)) {
      near <- unique(vapply(cat_all, function(e) e$name, character(1)))
      near <- near[agrepl(n, near, max.distance = 0.2)]
      cat("\n", n, ": NOT an exported function of the installed dartR packages.",
          if (length(near)) paste0(" Similar names: ", paste(utils::head(near, 8), collapse = ", ")) else "", "\n", sep = "")
      next
    }
    for (e in hit) {
      cat("\n== ", e$pkg, "::", e$name, "  (", e$pkg, " ", as.character(utils::packageVersion(e$pkg)), ")",
          if (e$deprecated) "  [DEPRECATED]" else "", "\n", sep = "")
      cat(e$title, "\n\n", signature_of(e$name, e$fn), "\n\n", sep = "")
      for (a in e$args) cat("  ", a, ": ", if (is.null(e$docs[[a]])) "(not documented)" else e$docs[[a]], "\n", sep = "")
      if (nzchar(e$datatype)) cat("\nData: ", e$datatype, ". ", DATATYPE_NOTE[[e$datatype]], "\n", sep = "")
      if (nzchar(e$value)) cat("\nReturns: ", e$value, "\n", sep = "")
      if (nzchar(e$details)) cat("\nDetails: ", clip(e$details, 1800), "\n", sep = "")
    }
  }
}

find_cmd <- function(pattern) {
  cat_all <- catalogue()
  for (e in cat_all)
    if (grepl(pattern, paste(e$name, e$title), ignore.case = TRUE))
      cat(sprintf("%-34s %-16s %s\n", e$name, e$pkg, clip(e$title, 100)))
}

main <- function(argv) {
  if (!length(argv)) { cat("usage: dartr_ref.R help <fn>... | find <pattern> | versions | build <dir>\n"); quit(status = 1) }
  if (!length(installed())) { cat("No dartR.* package is installed in this R (", R.version.string, ").\n", sep = ""); quit(status = 2) }
  switch(argv[1],
    help = help_cmd(argv[-1]),
    find = find_cmd(paste(argv[-1], collapse = " ")),
    versions = cat(R.version.string, "\n", gsub(", ", "\n", versions_line()), "\n", sep = ""),
    build = {
      qa <- build(argv[2])
      if (length(argv) >= 3) writeLines(as.character(qa), argv[3])
    },
    migration = migration(argv[2]),
    { cat("unknown command:", argv[1], "\n"); quit(status = 1) })
}
if (!interactive()) main(commandArgs(trailingOnly = TRUE))
