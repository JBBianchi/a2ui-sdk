import { basicCatalog, type Catalog } from '@a2ui-sdk/react/0.9'
import { RichChoicePicker } from '../components/RichChoicePicker'

export const richCatalogId =
  'https://a2ui-sdk.js.org/catalogs/rich_catalog.json'

export const richCatalog: Catalog = {
  ...basicCatalog,
  components: {
    ...basicCatalog.components,
    RichChoicePicker,
  },
  functions: {
    ...basicCatalog.functions,
    get: {
      returnType: 'any',
    },
    map: {
      returnType: 'any',
    },
  },
}

export function usesRichCatalog(catalogId: string | undefined): boolean {
  return catalogId === richCatalogId
}
