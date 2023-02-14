import { request, HttpResponse } from "/lib/http-client";

const URL_NTB = "https://kommunikasjon.ntb.no/json/v2/releases";

export function getPressReleases(params: GetPressReleaseParams): Array<PressRelease> {
  const res: HttpResponse = request({
    url: URL_NTB,
    params: params as Record<string, string>,
  });

  let pressReleases: PressRelease[] = [];

  if (res.status === 200) {
    const ntbResponse = JSON.parse(res.body ?? "") as NtbResponse;
    pressReleases = pressReleases.concat(ntbResponse.releases);

    if (params.fetchAllPressReleases && ntbResponse.nextPage != null) {
      pressReleases = pressReleases.concat(getPressReleases(
      {
        publisher: params.publisher,
        channels: params.channels,
        page: ntbResponse.nextPage,
        fetchAllPressReleases: params.fetchAllPressReleases,
      }, 
      ));
    }

  return pressReleases;
  } else {
    log.error("Failed to get press releases from NTB over HTTP");
    throw {
      type: "NtbFetchError",
      status: res.status,
      body: res.body,
    };
  }
}

interface GetPressReleaseParams {
  publisher?: string;
  page?: number;
  size?: number;
  search?: string;
  channels?: string;
  filters?: string;
  fetchAllPressReleases?: boolean;
}

interface NtbResponse {
  releases: PressRelease[];
  nextPage: number;
  totalCount: number;
}

export interface PressRelease {
  id: number;
  title: string;
  url: string;
  leadtext: string;
  video: Video;
  body: string;
  keywords: string[];
  published: string;
  publisher: Publisher;
  logos: Image[];
  images: Image[];
  documents: Document[];
  links?: Link[];
  channels: Channel[];
  boilerplate: string | null;
  contacts: Contact;
  version?: number;
  versions?: Version[];
  language: string;
  mainImage: Image;
  type: string;
  leadTextOrBodyStrip: string;
}

interface Video {
  url?: string | null;
  description?: string | null;
  channelUrl?: string | null;
}

interface Publisher {
  id: number;
  name: string | null;
}

interface Version {
  id?: number;
  title?: string | null;
  language?: string | null;
  url?: string | null;
}

export interface Image {
  url: string | null;
  focus?: string | null;
  caption: string | null;
  normal: string | null;
  thumbnail_original: string | null;
  thumbnail_square: string | null;
  thumbnail_4_3: string | null;
  thumbnail_16_9: string | null;
}

interface Document {
  url?: string | null;
  caption?: string | null;
}

export interface Link {
  url: string;
  description: string;
}

interface Channel {
  id: number;
  label: string | null;
}

interface Contact {
  text?: string | null;
  persons?: Person[];
}

interface Person {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  title?: string | null;
  image?: Image;
  contactLinks?: ContactLink;
}

interface ContactLink {
  blog?: string | null;
  linkedin?: string | null;
  skype?: string | null;
  twitter?: string | null;
}
