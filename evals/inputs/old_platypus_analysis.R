# Platypus population structure
# Written in 2023 with dartR 2.9

library(dartR)

gl <- platypus.gl

# ---- call rate ----
gl.report.callrate(gl, method = "loc", plot.out = FALSE)
gl <- gl.filter.callrate(gl, method = "loc", threshold = 0.9, plot.out = FALSE,
                         save2tmp = FALSE, verbose = 2)

# ---- Hardy-Weinberg within populations ----
gl <- gl.filter.hwe(gl, subset = "each", n.pop.threshold = 1, method_sig = "Exact",
                    multi_comp = FALSE, alpha_val = 0.05, pvalue_type = "midp",
                    min_sample_size = 5, verbose = 2)
gl <- gl.filter.monomorphs(gl)

# ---- ordination ----
pc <- gl.pcoa(gl, nfactors = 5, plot.out = FALSE)
write.csv(pc$scores, "pca_scores.csv")

# ---- distances between populations ----
d <- gl.dist.pop(gl, method = "euclidean", plot.out = FALSE, output = "matrix")
write.csv(as.matrix(d), "dist.csv")

# ---- diversity ----
stats <- gl.basic.stats(gl)
write.csv(stats$overall, "basic_stats.csv")

het <- gl.report.heterozygosity(gl, method = "pop", plot.display = FALSE, save2tmp = TRUE)
write.csv(het, "het.csv", row.names = FALSE)
