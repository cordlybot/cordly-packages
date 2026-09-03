# cordly-packages
#
# Node is not run on the host in this workspace, and a gate has to mean the same
# thing on every machine. Every target below runs in one pinned image, and CI
# runs these same commands.
#
#   make verify        everything a change has to pass
#   make release       verify, plus the packed artefacts installed into real consumers
#   make <one gate>    the same gate on its own, when something failed
#
# Dependency volumes are named rather than bind-mounted: node_modules written
# into a Windows bind mount by a Linux container is the reliable way to spend an
# afternoon on a symlink.

IMAGE ?= node:24-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2
BROWSERS ?= mcr.microsoft.com/playwright:v1.62.1-noble

MODULES_VOLUME ?= cordly_packages_modules
BROWSER_FIXTURE_VOLUME ?= cordly_fixture_browser_modules
SSR_FIXTURE_VOLUME ?= cordly_fixture_ssr_modules
COMPAT_VOLUME ?= cordly_compat22_modules
E2E_VOLUME ?= cordly_packages_e2e_modules

RUN = docker run --rm -v "$(CURDIR)":/w -w /w -v $(MODULES_VOLUME):/w/node_modules $(IMAGE)
RUN_BROWSER_FIXTURE = docker run --rm -v "$(CURDIR)":/w -w /w/fixtures/browser \
	-v $(BROWSER_FIXTURE_VOLUME):/w/fixtures/browser/node_modules $(IMAGE)
RUN_SSR_FIXTURE = docker run --rm -v "$(CURDIR)":/w -w /w/fixtures/ssr \
	-v $(SSR_FIXTURE_VOLUME):/w/fixtures/ssr/node_modules $(IMAGE)
RUN_COMPAT = docker run --rm -v "$(CURDIR)":/w -w /w/compat/angular-22 \
	-v $(COMPAT_VOLUME):/w/compat/angular-22/node_modules $(IMAGE)
RUN_E2E = docker run --rm --network host -v "$(CURDIR)":/w -w /w/e2e \
	-v $(E2E_VOLUME):/w/e2e/node_modules \
	-v $(SSR_FIXTURE_VOLUME):/w/fixtures/ssr/node_modules $(BROWSERS)

TARBALLS = /w/artifacts/cordly-tokens.tgz /w/artifacts/cordly-ui.tgz /w/artifacts/cordly-widgets.tgz

.DEFAULT_GOAL := help

.PHONY: help install verify release format format-check lint files hygiene \
	tokens tokens-build test build api api-write pack package-check \
	fixtures fixture-browser fixture-ssr compat e2e clean shell \
	release-status release-check bump

help: ## Show the available commands.
	@echo cordly-packages
	@echo.
	@echo "  make verify         Formatting, lint, structure, hygiene, tokens, build, tests, API, packaging"
	@echo "  make release        verify, then install the tarballs into both fixtures and the"
	@echo "                      compatibility harness and run the browser and SSR gates"
	@echo "  make install        Install pinned dependencies into the module volumes"
	@echo.
	@echo "  make tokens         Generated tokens match their source, and every contrast pair holds"
	@echo "  make files          Every component is four files, every directive two"
	@echo "  make hygiene        No credential, local path, personal data, or third-party name"
	@echo "  make build          Build both Angular packages"
	@echo "  make test           Unit tests for tokens, ui, and widgets"
	@echo "  make api            The public API matches its committed report"
	@echo "  make pack           Produce the tarballs a consumer would install"
	@echo "  make package-check  Tarball contents, exports, peers, and side effects"
	@echo "  make fixtures       Install the tarballs into both fixture consumers and build"
	@echo "  make compat         Compile every public export at the floor of the peer range"
	@echo "  make e2e            Browser, mobile, and SSR gates against the built fixtures"
	@echo.
	@echo "  make release-status Package versions against what the registry has"
	@echo "  make release-check  Refuse an incoherent release, without publishing"
	@echo "  make bump PKG=ui VERSION=0.2.0   Set one package's version"

install: ## Install pinned dependencies into the module volumes.
	$(RUN) npm ci --no-audit --no-fund
	$(RUN_BROWSER_FIXTURE) npm ci --no-audit --no-fund
	$(RUN_SSR_FIXTURE) npm ci --no-audit --no-fund
	$(RUN_COMPAT) npm ci --no-audit --no-fund
	$(RUN_E2E) npm ci --no-audit --no-fund

format: ## Rewrite files to the repository's formatting.
	$(RUN) npm run format

format-check: ## Formatting is already correct.
	$(RUN) npm run format:check

lint: build ## Lint, including the package-boundary and template accessibility rules.
	$(RUN) npm run lint

files: ## Every component is four files and every directive two.
	$(RUN) npm run files:check

hygiene: ## No credential, absolute local path, personal data, or third-party product name.
	$(RUN) npm run hygiene:check

tokens: ## Generated tokens match their source, and every contrast pair holds.
	$(RUN) npm run tokens:check
	$(RUN) npm run tokens:test

tokens-build: ## Regenerate the token artefacts from their source.
	$(RUN) npm run tokens:build

build: ## Build @cordly/ui and @cordly/widgets.
	$(RUN) npm run build

test: ## Unit tests for every package.
	$(RUN) npm run tokens:test
	$(RUN) npm test

api: ## The public API matches its committed report.
	$(RUN) npm run api:check

api-write: ## Regenerate the public API reports after an intentional change.
	$(RUN) npm run api:extract

pack: build ## Produce the tarballs a consumer would install.
	$(RUN) npm run pack:all

package-check: ## Tarball contents, exports, peer ranges, and side effects.
	$(RUN) npm run package:check

verify: ## Everything a change has to pass. CI runs exactly this.
	$(RUN) npm run verify

fixture-browser: ## Install the tarballs into the browser fixture and build it.
	$(RUN_BROWSER_FIXTURE) sh -c "npm ci --no-audit --no-fund && npm install --no-save --no-audit --no-fund $(TARBALLS) && npx ng build"

fixture-ssr: ## Install the tarballs into the SSR fixture and build it.
	$(RUN_SSR_FIXTURE) sh -c "npm ci --no-audit --no-fund && npm install --no-save --no-audit --no-fund $(TARBALLS) && npx ng build"

fixtures: fixture-browser fixture-ssr ## Both fixture consumers, from the packed artefacts.

compat: ## Compile every public export at the floor of the declared peer range.
	$(RUN_COMPAT) sh -c "npm ci --no-audit --no-fund && npm install --no-save --no-audit --no-fund $(TARBALLS) && npx ng build"

e2e: ## Browser, mobile, and SSR gates against the built fixtures.
	$(RUN_E2E) sh -c "npm ci --no-audit --no-fund && npx playwright test"

release: verify pack fixtures compat e2e ## Everything, including release evidence.
	@echo "release: packages built, packed, installed from tarballs, and proved in a browser and on a server"

release-status: ## Package versions against what the registry already has.
	$(RUN) node tools/release.mjs status

release-check: ## Refuse an incoherent release. Publishes nothing.
	$(RUN) node tools/release.mjs check

bump: ## Set one package's version, e.g. make bump PKG=ui VERSION=0.2.0
	$(RUN) node tools/release.mjs bump $(PKG) $(VERSION)

clean: ## Remove build output and the dependency volumes.
	rm -rf dist artifacts out-tsc coverage test-results playwright-report
	-docker volume rm $(MODULES_VOLUME) $(BROWSER_FIXTURE_VOLUME) $(SSR_FIXTURE_VOLUME) $(COMPAT_VOLUME) $(E2E_VOLUME)

shell: ## Open a shell in the toolchain image.
	docker run --rm -it -v "$(CURDIR)":/w -w /w -v $(MODULES_VOLUME):/w/node_modules $(IMAGE) bash
