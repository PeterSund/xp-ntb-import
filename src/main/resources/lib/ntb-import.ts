import { create, createMedia, modify, publish, query, Content, MediaImage } from "/lib/xp/content";
import { sanitize } from "/lib/xp/common";
import { request } from "/lib/http-client";
import { PressRelease, getPressReleases } from "./ntb";
import { NtbArticle } from "../site/content-types/ntb-article/ntb-article";
import { getContentPathById, notNullOrUndefined, substringAfter } from "./utils";
import { SiteConfig } from "../site/site-config";
import { getSiteConfigInCron } from "./portal";

const CONTENT_CREATE_FAILED = null;

export function importFromNtb(): void {
  const params = getSiteConfigInCron<SiteConfig>();
  const parentPath = getContentPathById(params.parentId);
  const pressReleases = getPressReleases({
    publisher: params.publisher,
    channels: params.channels,
    //size: 5,
  }, params.fetchAllPressReleases);

  const createdContentIds = pressReleases
    .filter(notAlreadyImported)
    .map((pressRelease) => importPressRelease(pressRelease, parentPath))
    .filter(notNullOrUndefined);

  log.info(`Created ${createdContentIds.length} articles by importing from NTB`);

  const publishResults = publish({
    keys: createdContentIds,
    sourceBranch: "draft",
    targetBranch: "master",
    includeDependencies: true,
  });

  if (publishResults.pushedContents.length > 0) {
    log.info(`Published ${publishResults.pushedContents.length} contents as part of import from NTB`);
  }

  if (publishResults.failedContents.length > 0) {
    log.error(`Failed to publish ${publishResults.failedContents.length} as part of import from NTB`);
  }
}

function importPressRelease(pressRelease: PressRelease, parentPath: string) {
  try {
    const articleContent = create<NtbArticle>({
      contentType: `${app.name}:ntb-article`,
      displayName: pressRelease.title,
      parentPath,
      name: sanitize(pressRelease.title),
      refresh: false,
      data: pressReleaseToNtbArticle(pressRelease),
      language: pressRelease.language,
    });

    const imageContent = pressRelease.mainImage?.url
      ? createImageContent(pressRelease.mainImage.url, articleContent._path, pressRelease.mainImage?.caption)
      : undefined;

    const imageIds = pressRelease.images
      .map((image) => {
        return image.url ? createImageContent(image.url, articleContent._path, image.caption) : undefined;
      })
      .filter(notNullOrUndefined)
      .map((content) => content._id);

    // Update content with images
    return modify<NtbArticle>({
      key: articleContent._id,
      editor: (content) => {
        content.data.imageId = imageContent?._id;
        content.data.images = imageIds;
        content.workflow = {
          state: "READY",
          checks: {}
        };
        return content;
      },
    })._id;
  } catch (e) {
    log.error(`Unexpected error: ${e.message}`);
    log.error(String(e));

    return CONTENT_CREATE_FAILED;
  }
}

function notAlreadyImported(pressRelease: PressRelease): boolean {
  return (
    query({
      query: `data.ntbId = '${pressRelease.id}'`,
      count: 1,
    }).count === 0
  );
}

function createImageContent(
  url: string,
  parentPath: string,
  caption: string | null
): Content<MediaImage> | typeof CONTENT_CREATE_FAILED {
  const name = substringAfter(url);
  const imageResponse = request({ url });

  if (imageResponse.status === 200) {
    const image = createMedia<MediaImage>({
      name,
      parentPath,
      data: imageResponse.bodyStream,
      mimeType: imageResponse.contentType,
    });

    return modify<MediaImage>({
      key: image._id,
      editor: (c) => {
        return {
          ...c,
          data: {
            ...c.data,
            caption: caption ?? undefined,
            altText: caption ?? undefined,
          },
        };
      },
    });
  } else {
    log.warning(`Could not retrieve image for NTB import: url=${url}, status=${status} `);
    return CONTENT_CREATE_FAILED;
  }
}

function pressReleaseToNtbArticle(pressRelease: PressRelease): NtbArticle {
  return {
    title: pressRelease.title,
    leadtext: pressRelease.leadtext ?? pressRelease.leadTextOrBodyStrip,
    body: pressRelease.body,
    links: pressRelease.links,
    keywords: pressRelease.keywords ?? [],
    ntbId: pressRelease.id,
    published: pressRelease.published,
    url: `https://kommunikasjon.ntb.no${pressRelease.url}`,
    publisherId: pressRelease.publisher.id,
    channelId: pressRelease.channels.length > 0 ? pressRelease.channels[0].id : undefined,
    type: pressRelease.type,
    language: pressRelease.language,
  };
}
