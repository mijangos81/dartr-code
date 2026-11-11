# dartr-code

A skill that helps an AI coding assistant write correct R code for the
[dartRverse](https://github.com/green-striped-gecko/dartRverse)
population-genetics packages: dartR.base, dartR.popgen, dartR.spatial,
dartR.captive, dartR.sexlinked and dartR.sim.

Website, with four worked examples: <https://mijangos81.github.io/dartr-code/>

A skill is a folder of instructions and reference files that the assistant
loads when a task calls for it. This one targets the two ways dartR code goes
wrong when an assistant writes it from memory:

- **Wrong names.** The suite exports 263 functions, and argument names changed
  when the old `dartR` package was split into the dartRverse. Assistants
  therefore invent arguments, or call functions that no longer exist.
- **Code that runs and returns a wrong result.** For example, `gl.read.dart()`
  drops every sample that has no row in the metadata file and raises no error,
  and `gl.keep.ind()` returns individuals in the object's order, so labels
  assigned by position land on the wrong individuals.

## What is in it

| Path | Contents |
|---|---|
| `skills/dartr-code/SKILL.md` | What the assistant reads first: how to look up a function, the order of work, and the ten most common traps |
| `skills/dartr-code/scripts/dartr_ref.R` | Reads exact signatures and help text from the dartR packages installed on your computer |
| `skills/dartr-code/references/` | The same function reference as static files, for assistants that cannot run R; the full list of traps; what changed from the old `dartR`; and a map of the ebook and workshop tutorials |
| `plugin.json`, `skills/dartr-code/agents/openai.yaml` | Packaging for Codex and the ChatGPT desktop app |
| `evals/` | Six test tasks and their input files |

## Install

The same folder, `skills/dartr-code`, serves every assistant. Get it with:

```bash
git clone https://github.com/mijangos81/dartr-code.git
```

**Claude Code.** Copy the folder into `.claude/skills/` in your home folder
(available in every project) or into `.claude/skills/` inside one project:

```bash
mkdir -p ~/.claude/skills
cp -r dartr-code/skills/dartr-code ~/.claude/skills/
```

**Codex.** Copy the folder into `.agents/skills/` in your home folder, or into
`.agents/skills/` inside one repository:

```bash
mkdir -p ~/.agents/skills
cp -r dartr-code/skills/dartr-code ~/.agents/skills/
```

Type `$dartr-code` in a prompt to call it by name.

**ChatGPT desktop app.** The repository is also a plugin (`plugin.json` at its
root). Install it as a local plugin by following
[OpenAI's instructions](https://developers.openai.com/plugins/build/plugins),
section "Install a local plugin manually". ChatGPT on the web cannot install a
plugin from a folder or a zip file: it takes plugins from its directory, where
this one is not listed.

In each case the assistant loads the skill when you ask for dartR code. Other
assistants that read skills in this format (a folder with a `SKILL.md` file)
can use the same folder.

To look functions up in your own installation, the assistant needs to be able
to run `Rscript` from an R that has the dartRverse installed. Without that it
falls back on the static files.

## Versions

The static reference was generated on 11 November 2026 from the `dev`
branches: dartRverse 1.2.7, and dartR.base and the other dartR.* packages
1.2.6. CRAN holds dartR.base 1.2.3, in which 18 functions have fewer arguments,
so a call taken from the static files can fail with `unused argument` on a
CRAN installation. The lookup script does not have this problem, because it
reads the version you have installed.

To regenerate the function files and `index.md` after a package update:

```bash
Rscript skills/dartr-code/scripts/dartr_ref.R build skills/dartr-code/references
```

`traps.md` and `resources.md` are written by hand and are not touched by the
build.

## Status

Version 0.5.0, an early release. It has had one test, on version 0.3.0 with
Claude: six tasks, one run each, given to an assistant that could not run R,
whose scripts were then run and checked. Scripts written with the skill passed
31 of 34 checks; scripts written without it passed 13 of 34. One run per task is
too few to say how much of that difference is chance, and the test has not been
repeated since.

In Codex (CLI 0.153.0) the skill was confirmed to load and to be listed to the
model. No task has been run with it in Codex, and it has not been installed in
ChatGPT.

Changes are listed in `NEWS.md`.

The traps for dartR.base are the most complete. Those for dartR.popgen,
dartR.spatial and dartR.sim are thinner.

## Feedback

Open an issue in this repository, or post to the
[dartR Google Group](https://groups.google.com/g/dartr).

## Licence

GPL-3; see `LICENSE`. The function descriptions are taken from the help pages
of the dartRverse packages, which are licensed GPL (>= 3). Two files in
`evals/inputs/`, `Report_DTest25-0001_SNP_2.csv` and `sample_sheet.csv`, are
copies of the example files in the dartR.data package.
