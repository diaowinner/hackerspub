import { escape } from "@std/html/entities";
import { renderCustomEmojis } from "../models/emoji.ts";
import type { FollowingState } from "../models/following.ts";
import { preprocessContentHtml, sanitizeHtml } from "../models/html.ts";
import type { AccountLink, Actor } from "../models/schema.ts";
import { compactUrl } from "../utils.ts";
import { Button } from "./Button.tsx";
import { Msg } from "./Msg.tsx";
import { PageTitle } from "./PageTitle.tsx";

export interface ProfileProps {
  actor: Actor;
  actorMentions: { actor: Actor }[];
  followingState?: FollowingState;
  followedState?: FollowingState;
  links?: AccountLink[];
  profileHref: string;
}

export function Profile(
  { actor, actorMentions, profileHref, followingState, followedState, links }:
    ProfileProps,
) {
  const bioHtml = preprocessContentHtml(
    actor.bioHtml ?? "",
    actorMentions,
    actor.emojis,
  );
  return (
    <>
      <div class="flex">
        {actor.avatarUrl && (
          <img
            src={actor.avatarUrl}
            width={56}
            height={56}
            class="mb-5 mr-4"
          />
        )}
        <PageTitle
          subtitle={{
            text: (
              <>
                <span class="select-all">
                  @{actor.username}@{actor.instanceHost}
                </span>{" "}
                &middot; {actor.accountId == null
                  ? (
                    <Msg
                      $key="profile.followeesCount"
                      count={actor.followeesCount}
                    />
                  )
                  : (
                    <a href={`${profileHref}/following`}>
                      <Msg
                        $key="profile.followeesCount"
                        count={actor.followeesCount}
                      />
                    </a>
                  )} &middot; {actor.accountId == null
                  ? (
                    <Msg
                      $key="profile.followersCount"
                      count={actor.followersCount}
                    />
                  )
                  : (
                    <a href={`${profileHref}/followers`}>
                      <Msg
                        $key="profile.followersCount"
                        count={actor.followersCount}
                      />
                    </a>
                  )}
                {followedState === "following" &&
                  (
                    <>
                      {" "}&middot; <Msg $key="profile.followsYou" />
                    </>
                  )}
              </>
            ),
          }}
        >
          {actor.name == null ? actor.username : (
            <span
              dangerouslySetInnerHTML={{
                __html: renderCustomEmojis(escape(actor.name), actor.emojis),
              }}
            />
          )}
        </PageTitle>
        {followingState === "none"
          ? (
            <form method="post" action={`${profileHref}/follow`}>
              <Button class="ml-4 mt-2 h-9">
                {followedState === "following"
                  ? <Msg $key="profile.followBack" />
                  : <Msg $key="profile.follow" />}
              </Button>
            </form>
          )
          : followingState != null &&
            (
              <form method="post" action={`${profileHref}/unfollow`}>
                <Button class="ml-4 mt-2 h-9">
                  {followingState === "following"
                    ? <Msg $key="profile.unfollow" />
                    : <Msg $key="profile.cancelRequest" />}
                </Button>
              </form>
            )}
      </div>
      <div
        class="prose dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: bioHtml }}
      />
      {links != null && links.length > 0 && (
        <dl class="mt-5 flex flex-wrap gap-y-3">
          {links.map((link) => (
            <>
              <dt
                key={`dt-${link.index}`}
                class={`
                    opacity-50 mr-1
                    flex flex-row
                    ${link.index > 0 ? "before:content-['·']" : ""}
                  `}
              >
                <img
                  src={`/icons/${link.icon}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  class={`dark:invert block mr-1 ${
                    link.index > 0 ? "ml-2" : ""
                  }`}
                />
                <span class="block after:content-[':']">{link.name}</span>
              </dt>
              <dd key={`dd-${link.index}`} class="mr-2">
                <a href={link.url} rel="me">
                  {link.handle ?? compactUrl(link.url)}
                </a>
              </dd>
            </>
          ))}
        </dl>
      )}
      {links == null && Object.keys(actor.fieldHtmls).length > 0 && (
        <dl class="mt-5 flex flex-wrap gap-y-3">
          {Object.entries(actor.fieldHtmls).map(([name, html], i) => (
            <>
              <dt
                key={`dt-${i}`}
                class={`
                    opacity-50 mr-1
                    ${i > 0 ? "before:content-['·']" : ""}
                    after:content-[':']
                  `}
              >
                <span
                  class={i > 0 ? "ml-2" : ""}
                  dangerouslySetInnerHTML={{
                    __html: renderCustomEmojis(escape(name), actor.emojis),
                  }}
                />
              </dt>
              <dd
                key={`dd-${i}`}
                class="mr-2"
                dangerouslySetInnerHTML={{
                  __html: renderCustomEmojis(
                    sanitizeHtml(html),
                    actor.emojis,
                  ),
                }}
              >
              </dd>
            </>
          ))}
        </dl>
      )}
    </>
  );
}
