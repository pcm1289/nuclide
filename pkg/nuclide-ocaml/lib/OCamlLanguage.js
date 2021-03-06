/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ServerConnection} from '../../nuclide-remote-connection';
import type {AtomLanguageServiceConfig} from '../../nuclide-language-service/lib/AtomLanguageService';
import type {LanguageService} from '../../nuclide-language-service/lib/LanguageService';

import {
  AtomLanguageService,
  getHostServices,
} from '../../nuclide-language-service';
import {NullLanguageService} from '../../nuclide-language-service-rpc';
import {getNotifierByConnection} from '../../nuclide-open-files';
import {getVSCodeLanguageServiceByConnection} from '../../nuclide-remote-connection';

async function createOCamlLanguageService(
  connection: ?ServerConnection,
): Promise<LanguageService> {
  const service = getVSCodeLanguageServiceByConnection(connection);
  const [fileNotifier, host] = await Promise.all([
    getNotifierByConnection(connection),
    getHostServices(),
  ]);

  const lspService = await service.createMultiLspLanguageService(
    'ocaml',
    'ocaml-language-server',
    ['--stdio'],
    {
      logCategory: 'OcamlService',
      logLevel: 'INFO',
      fileNotifier,
      host,
      projectFileNames: ['esy', 'esy.json', 'package.json', '.merlin'],
      projectFileSearchStrategy: 'priority',
      useOriginalEnvironment: true,
      fileExtensions: ['.ml', '.mli', '.re', '.rei'],
      initializationOptions: {
        codelens: {
          unicode: true,
        },
        debounce: {
          linter: 10 * 1000, // 10s
        },
        diagnostics: {
          merlinPerfLogging: true,
          tools: ['merlin'],
        },
        path: {
          ocamlfind: 'ocamlfind',
          ocamlmerlin: 'ocamlmerlin',
          opam: 'opam',
          rebuild: 'rebuild',
          refmt: 'refmt',
          refmterr: 'refmterr',
          rtop: 'rtop',
        },
        server: {
          languages: ['ocaml', 'reason'],
        },
      },
    },
  );
  return lspService || new NullLanguageService();
}

export function createLanguageService(): AtomLanguageService<LanguageService> {
  const atomConfig: AtomLanguageServiceConfig = {
    name: 'OCaml',
    grammars: ['source.ocaml', 'source.reason'],
    outline: {
      version: '0.1.0',
      priority: 1,
      analyticsEventName: 'ocaml.outline',
    },
    definition: {
      version: '0.1.0',
      priority: 20,
      definitionEventName: 'ocaml.getDefinition',
    },
    typeHint: {
      version: '0.0.0',
      priority: 1,
      analyticsEventName: 'ocaml.typeHint',
    },
    codeFormat: {
      version: '0.1.0',
      priority: 1,
      analyticsEventName: 'ocaml.formatCode',
      canFormatRanges: true,
      canFormatAtPosition: false,
    },
    findReferences: {
      version: '0.1.0',
      analyticsEventName: 'ocaml.findReferences',
    },
    autocomplete: {
      inclusionPriority: 1,
      // OCaml completions are more relevant than snippets.
      suggestionPriority: 3,
      disableForSelector: null,
      excludeLowerPriority: false,
      analytics: {
        eventName: 'nuclide-ocaml',
        shouldLogInsertedSuggestion: false,
      },
      autocompleteCacherConfig: null,
    },
    diagnostics: {
      version: '0.2.0',
      analyticsEventName: 'ocaml.observeDiagnostics',
    },
  };

  return new AtomLanguageService(createOCamlLanguageService, atomConfig);
}
