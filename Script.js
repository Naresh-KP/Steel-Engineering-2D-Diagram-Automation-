<script>
            window.currentScaleL = 1.0;
            window.currentScaleCS = 1.0;
            window.isCanvasPopulated = false;

            function openSiteModal(title, text) {
              document.getElementById("siteModalHeader").innerText = title;
              document.getElementById("siteModalBody").innerText = text;
              document.getElementById("siteModal").style.display = "flex";
            }

            function closeSiteModal() {
              document.getElementById("siteModal").style.display = "none";
            }

            function switchShapeProfile() {
              let mode = document.getElementById("shape-type").value;
              document
                .querySelectorAll(".dynamic-group")
                .forEach((el) => (el.style.display = "none"));

              if (mode === "step") {
                document.getElementById("group-step").style.display = "flex";
              } else if (mode === "ibeam") {
                document.getElementById("group-ibeam").style.display = "flex";
              } else if (mode === "channel") {
                document.getElementById("group-channel").style.display = "flex";
              } else {
                document.getElementById("group-standard").style.display = "flex";
                document.getElementById("container-id").style.display =
                  mode === "bar" ? "none" : "flex";
              }
            }

            function scaleL(v) {
              return v * window.currentScaleL;
            }
            function scaleCS(v) {
              return v * window.currentScaleCS;
            }

            function processEngineeringCalculations() {
              let mode = document.getElementById("shape-type").value;

              if (mode === "bar" && (!val("std-od") || !val("std-l"))) {
                openSiteModal(
                  "Validation Error",
                  "Please enter Outer Diameter (OD) and Total Length (L) parameters for Solid Round Bar class configuration.",
                );
                return;
              }
              if (
                mode === "ring" &&
                (!val("std-od") || !val("std-id") || !val("std-l"))
              ) {
                openSiteModal(
                  "Validation Error",
                  "Please enter Outer Diameter (OD), Inner Diameter (ID), and Total Length (L) parameters for Mechanical Ring / Collar configuration.",
                );
                return;
              }
              if (
                mode === "pipe" &&
                (!val("std-od") || !val("std-id") || !val("std-l"))
              ) {
                openSiteModal(
                  "Validation Error",
                  "Please enter Outer Diameter (OD), Inner Diameter (ID), and Total Length (L) parameters for Hollow Pipe Line configuration.",
                );
                return;
              }
              if (
                mode === "ibeam" &&
                (!val("ib-h") ||
                  !val("ib-b") ||
                  !val("ib-tf") ||
                  !val("ib-tw") ||
                  !val("ib-l"))
              ) {
                openSiteModal(
                  "Validation Error",
                  "Missing dimension inputs! Please configure Height (H), Flange Width (B), Flange Thickness (tf), Web Thickness (tw), and Length (L) for I-Beam structural profile.",
                );
                return;
              }
              if (
                mode === "channel" &&
                (!val("cc-h") ||
                  !val("cc-b") ||
                  !val("cc-tf") ||
                  !val("cc-tw") ||
                  !val("cc-l"))
              ) {
                openSiteModal(
                  "Validation Error",
                  "Missing dimension inputs! Please configure Height (H), Flange Width (B), Flange Thickness (tf), Web Thickness (tw), and Length (L) for C-Channel structural profile.",
                );
                return;
              }

              let validStepsD = [];
              let validStepsL = [];
              if (mode === "step") {
                for (let i = 1; i <= 5; i++) {
                  let dVal = document.getElementById(`s-d${i}`).value.trim();
                  let lVal = document.getElementById(`s-l${i}`).value.trim();
                  if (dVal !== "" && lVal !== "" && !isNaN(dVal) && !isNaN(lVal)) {
                    validStepsD.push(+dVal);
                    validStepsL.push(+lVal);
                  }
                }
                if (validStepsD.length < 3) {
                  openSiteModal(
                    "Validation Error",
                    "Staggered Convex Power Axis requires at least the first three step profiles (Step 1, Step 2, and Step 3) to be fully populated.",
                  );
                  return;
                }
              }

              let compValue =
                document.getElementById("company-name").value.trim() || "--";
              let woValue =
                document.getElementById("work-order").value.trim() || "--";
              let userValue =
                document.getElementById("generated-by").value.trim() || "--";
              let dateValue = new Date().toLocaleDateString();

              document.getElementById("screen-company").innerText = compValue;
              document.getElementById("screen-workorder").innerText = woValue;
              document.getElementById("screen-generatedby").innerText = userValue;
              document.getElementById("screen-date").innerText = dateValue;

              document.getElementById("out-company").innerText = compValue;
              document.getElementById("out-workorder").innerText = woValue;
              document.getElementById("out-generatedby").innerText = userValue;
              document.getElementById("out-date").innerText = dateValue;

              let svg = document.getElementById("svg");
              let defs = svg.querySelector("defs").innerHTML;
              svg.innerHTML = "<defs>" + defs + "</defs>";

              let items = [];
              let applicationDetails = [];
              const STEEL_DENSITY_KG_MM3 = 0.00000785;
              let max_L = 100,
                max_D = 100;

              if (mode === "bar" || mode === "ring" || mode === "pipe") {
                max_L = +val("std-l");
                max_D = +val("std-od");
              } else if (mode === "step") {
                max_L = validStepsL.reduce((a, b) => a + b, 0);
                max_D = Math.max(...validStepsD);
              } else if (mode === "ibeam") {
                max_L = +val("ib-l");
                max_D = Math.max(+val("ib-h"), +val("ib-b"));
              } else if (mode === "channel") {
                max_L = +val("cc-l");
                max_D = Math.max(+val("cc-h"), +val("cc-b"));
              }

              max_L = max_L || 1;
              max_D = max_D || 1;
              const DRAW_WIDTH = 450,
                DRAW_HEIGHT = 120;
              window.currentScaleL = Math.min(DRAW_WIDTH / max_L, 1);
              window.currentScaleCS = Math.min(DRAW_HEIGHT / max_D, 1);

              if (mode === "bar" || mode === "ring" || mode === "pipe") {
                let od = +val("std-od"),
                  l = +val("std-l"),
                  id = mode === "bar" ? 0 : +val("std-id");
                let crossSectionArea =
                  (Math.PI * Math.pow(od, 2)) / 4 - (Math.PI * Math.pow(id, 2)) / 4;
                if (crossSectionArea < 0) crossSectionArea = 0;

                let totalVolume = crossSectionArea * l;
                let weight = totalVolume * STEEL_DENSITY_KG_MM3;

                let inventoryDetails = [
                  `Material Class: Steel`,
                  `Density Reference: 7.85 g/cm³`,
                  `Calculated Mass Weight: ${weight.toFixed(2)} kg`,
                  `Outer Profile Diameter (OD): ${od} mm`,
                  `Total Axis Length (L): ${l} mm`,
                ];
                if (id > 0)
                  inventoryDetails.push(`Internal Core Bore (ID): ${id} mm`);

                applicationDetails =
                  mode === "bar"
                    ? [
                        "Transmission drive-shaft stock",
                        "Hydraulic core cylinder components",
                        "Precision fasteners raw stock",
                      ]
                    : mode === "ring"
                      ? [
                          "Heavy machine bearing sleeves",
                          "Spacer collar housings",
                          "Flanged coupler collars",
                        ]
                      : [
                          "Fluid high-pressure transportation lines",
                          "Longitudinal framework scaffolding",
                          "Industrial process structural conduit",
                        ];

                items = [
                  {
                    title: "Geometric Definition",
                    points: [
                      `System Matrix: Uniform Axis Cylinder System (${mode.toUpperCase()})`,
                      `Section Area: ${crossSectionArea.toFixed(2)} mm²`,
                      `Displacement Volume: ${totalVolume.toFixed(2)} mm³`,
                    ],
                  },
                  { title: "Material Inventory Profile", points: inventoryDetails },
                  {
                    title: "Lathe Production Sequence",
                    points: [
                      "Face raw bar stock component on lathe chuck profiles",
                      "Run uniform external turning path sweeps to dimension targets",
                      id > 0
                        ? "Drill pilot engine layout center -> engage structural boring system tool"
                        : "Polish final dimension boundaries to specification tolerances",
                    ],
                  },
                  {
                    title: "Target Engineering Applications",
                    points: applicationDetails,
                  },
                ];
                drawStandardProfile(svg, od, id, l);
              } else if (mode === "step") {
                applicationDetails = [
                  "Automotive stepped transmission shafts",
                  "Electric motor drive assembly hubs",
                  "Industrial gear box transmission units",
                ];
                let totalVol = 0;
                for (let i = 0; i < validStepsD.length; i++) {
                  totalVol +=
                    ((Math.PI * Math.pow(validStepsD[i], 2)) / 4) * validStepsL[i];
                }
                let weight = totalVol * STEEL_DENSITY_KG_MM3;
                let dimensionTextPoints = [
                  "Material Specification: Steel",
                  `Finished Mass Weight: ${weight.toFixed(2)} kg`,
                ];
                for (let i = 0; i < validStepsD.length; i++) {
                  dimensionTextPoints.push(
                    `Profile Tier ${i + 1}: Diameter Ø ${validStepsD[i]} mm &times; Length ${validStepsL[i]} mm`,
                  );
                }

                items = [
                  {
                    title: "Geometric Definition",
                    points: [
                      `System Matrix: Convex Power Transmitting Axle (${validStepsD.length} steps configuration)`,
                      `Total Assembled Length: ${validStepsL.reduce((a, b) => a + b, 0)} mm`,
                      `Combined Volume Profile: ${totalVol.toFixed(2)} mm³`,
                    ],
                  },
                  {
                    title: "Material Inventory Profile",
                    points: dimensionTextPoints,
                  },
                  {
                    title: "Lathe Production Sequence",
                    points: [
                      "Turn tier one baseline structural shaft layout pass",
                      "Reposition manual tooling compound post for step profile steps",
                      "Complete multi-tier finish runs to programmatic blueprint limits",
                    ],
                  },
                  {
                    title: "Target Engineering Applications",
                    points: applicationDetails,
                  },
                ];
                drawStepShaftProfile(
                  svg,
                  validStepsD,
                  validStepsL,
                  window.currentScaleL,
                );
              } else if (mode === "ibeam") {
                let h = +val("ib-h"),
                  b = +val("ib-b"),
                  tf = +val("ib-tf"),
                  tw = +val("ib-tw"),
                  l = +val("ib-l");
                let crossSectionArea = 2 * b * tf + (h - 2 * tf) * tw;
                let totalVolume = crossSectionArea * l;
                let weight = totalVolume * STEEL_DENSITY_KG_MM3;
                applicationDetails = [
                  "Cross-member heavy structural floor foundations",
                  "Crane overhead hoist runner frames",
                  "Bridge architectural support framing joints",
                ];

                items = [
                  {
                    title: "Geometric Definition",
                    points: [
                      "System Matrix: Heavy-Duty Universal Structural Web I-Beam",
                      `Total Cross Sectional Profile Area: ${crossSectionArea.toFixed(2)} mm²`,
                      `Displacement Volume Profile: ${totalVolume.toFixed(2)} mm³`,
                    ],
                  },
                  {
                    title: "Material Inventory Profile",
                    points: [
                      "Material Class: Steel",
                      `Segment Linear Weight: ${weight.toFixed(2)} kg`,
                      `Total Height (H): ${h} mm`,
                      `Flange Structural Width (B): ${b} mm`,
                      `Flange Profile Thickness (tf): ${tf} mm`,
                      `Web Load Core Thickness (tw): ${tw} mm`,
                      `Total Span Profile Length (L): ${l} mm`,
                    ],
                  },
                  {
                    title: "Mechanical Performance Analysis",
                    points: [
                      "Engineered to combat heavy cross-vertical structural loads safely",
                      "Symmetrical distribution prevents axial structural deflection under strain",
                      "Web core matrix handles severe engineering vertical shear stresses safely",
                    ],
                  },
                  {
                    title: "Target Engineering Applications",
                    points: applicationDetails,
                  },
                ];
                drawIBeamProfile(svg, h, b, tf, tw, l);
              } else if (mode === "channel") {
                let h = +val("cc-h"),
                  b = +val("cc-b"),
                  tf = +val("cc-tf"),
                  tw = +val("cc-tw"),
                  l = +val("cc-l");
                let crossSectionArea = 2 * b * tf + (h - 2 * tf) * tw;
                let totalVolume = crossSectionArea * l;
                let weight = totalVolume * STEEL_DENSITY_KG_MM3;
                applicationDetails = [
                  "Heavy transport chassis structure frames",
                  "Solar panel mounting strut modules",
                  "Industrial construction wall girts and purlins",
                ];

                items = [
                  {
                    title: "Geometric Definition",
                    points: [
                      "System Matrix: Structural C-Channel System Section Profile",
                      `Total Cross Sectional Profile Area: ${crossSectionArea.toFixed(2)} mm²`,
                      `Displacement Volume Profile: ${totalVolume.toFixed(2)} mm³`,
                    ],
                  },
                  {
                    title: "Material Inventory Profile",
                    points: [
                      "Material Class: Steel",
                      `Structural System Unit Mass Weight: ${weight.toFixed(2)} kg`,
                      `Total Height (H): ${h} mm`,
                      `Flange Structural Width (B): ${b} mm`,
                      `Flange Profile Thickness (tf): ${tf} mm`,
                      `Web Load Core Thickness (tw): ${tw} mm`,
                      `Total Span Profile Length (L): ${l} mm`,
                    ],
                  },
                  {
                    title: "Mechanical Performance Analysis",
                    points: [
                      "Offers incredible longitudinal structural flexure torque resistance",
                      "Flush flat rear face allows modular fast flush structural bolting interfaces",
                      "Optimal weight-to-tensile ratio values for light production framing builds",
                    ],
                  },
                  {
                    title: "Target Engineering Applications",
                    points: applicationDetails,
                  },
                ];
                drawChannelProfile(svg, h, b, tf, tw, l);
              }

              let reportContainer = document.getElementById("report-output");
              reportContainer.innerHTML = "";
              items.forEach((item) => {
                let listHTML = item.points.map((p) => `<li>${p}</li>`).join("");
                reportContainer.innerHTML += `
                  <div class="report-item">
                    <strong>${item.title}</strong>
                    <ul>${listHTML}</ul>
                  </div>`;
              });

              window.isCanvasPopulated = true;
            }

            function drawStandardProfile(svg, od, id, l) {
              let scale = autoScaleStandardProfile(od, l, 180, 500);
              let cx = 120,
                cy = 130,
                startX = 280;
              let scaledOD = od * scale,
                scaledID = id * scale,
                scaledL = l * scale;
              let radiusOD = scaledOD / 2,
                radiusID = scaledID / 2;
              let cOD = "#1e293b",
                cID = "#1e293b",
                cL = "#2563eb";

              circle(svg, cx, cy, radiusOD, cOD);
              if (id > 0 && id < od) circle(svg, cx, cy, radiusID, cID);

              line(
                svg,
                cx - radiusOD - 20,
                cy,
                cx + radiusOD + 20,
                cy,
                "#94a3b8",
                "6,4",
              );
              line(
                svg,
                cx,
                cy - radiusOD - 20,
                cx,
                cy + radiusOD + 20,
                "#94a3b8",
                "6,4",
              );

              let sideHeight = scaledOD;
              if (id > 0 && id < od) {
                let boreHeight = scaledID;
                rect(
                  svg,
                  startX,
                  cy - sideHeight / 2,
                  scaledL,
                  sideHeight,
                  "none",
                  cOD,
                );
                rect(
                  svg,
                  startX,
                  cy - sideHeight / 2,
                  scaledL,
                  (sideHeight - boreHeight) / 2,
                  "url(#hatch-pattern)",
                  cOD,
                );
                rect(
                  svg,
                  startX,
                  cy + boreHeight / 2,
                  scaledL,
                  (sideHeight - boreHeight) / 2,
                  "url(#hatch-pattern)",
                  cOD,
                );
                line(
                  svg,
                  startX,
                  cy - boreHeight / 2,
                  startX + scaledL,
                  cy - boreHeight / 2,
                  cID,
                );
                line(
                  svg,
                  startX,
                  cy + boreHeight / 2,
                  startX + scaledL,
                  cy + boreHeight / 2,
                  cID,
                );
              } else {
                rect(
                  svg,
                  startX,
                  cy - sideHeight / 2,
                  scaledL,
                  sideHeight,
                  "url(#hatch-pattern)",
                  cOD,
                );
              }
              line(svg, startX - 25, cy, startX + scaledL + 30, cy, "#94a3b8", "6,4");

              dimV(
                svg,
                startX + scaledL + 90,
                cy - sideHeight / 2,
                cy + sideHeight / 2,
                "Ø " + od + " mm",
                cOD,
              );
              if (id > 0 && id < od)
                dimV(
                  svg,
                  startX + scaledL + 25,
                  cy - scaledID / 2,
                  cy + scaledID / 2,
                  "Ø " + id + " mm",
                  cID,
                );
              dimH(
                svg,
                startX,
                startX + scaledL,
                cy + sideHeight / 2 + 50,
                cy + sideHeight / 2,
                "L: " + l + " mm",
                cL,
              );
            }

            function autoScaleStandardProfile(
              od,
              length,
              circleAreaWidth,
              sideAreaWidth,
            ) {
              let scaleForCircle = 220 / od;
              let scaleForLength = sideAreaWidth / length;
              return Math.min(scaleForCircle, scaleForLength, 1);
            }

            function drawStepShaftProfile(svg, d, l, scaleFit) {
              let cx = 120,
                startX = 280;
              let maxD = Math.max(...d);
              let maxR = scaleCS(maxD / 2);
              let cy = Math.max(295 - maxR - (d.length * 20 + 25), 95);

              for (let i = 0; i < d.length; i++)
                circle(svg, cx, cy, scaleCS(d[i] / 2), "#1e293b");
              line(svg, cx - maxR - 20, cy, cx + maxR + 20, cy, "#94a3b8", "6,4");
              line(svg, cx, cy - maxR - 20, cx, cy + maxR + 20, "#94a3b8", "6,4");

              let currentX = startX;
              for (let i = 0; i < d.length; i++) {
                let sW = l[i] * scaleFit,
                  sH = scaleCS(d[i]),
                  sY = cy - sH / 2;
                rect(svg, currentX, sY, sW, sH, "url(#hatch-pattern)", "#1e293b");
                line(svg, currentX, sY, currentX, sY + sH, "#1e293b");
                dimV_centered(
                  svg,
                  currentX + sW / 2,
                  cy - sH / 2,
                  cy + sH / 2,
                  "Ø " + d[i],
                  "#0f172a",
                );
                currentX += sW;
              }

              let dimX = startX;
              for (let i = 0; i < d.length; i++) {
                let sW = l[i] * scaleFit;
                dimH(
                  svg,
                  dimX,
                  dimX + sW,
                  cy + maxR + 25 + i * 20,
                  cy + scaleCS(d[i] / 2),
                  `L${i + 1}: ${l[i]} mm`,
                  "#1e293b",
                );
                dimX += sW;
              }
              line(svg, startX - 25, cy, currentX + 25, cy, "#94a3b8", "12,6");
            }

            function drawIBeamProfile(svg, h, b, tf, tw, l) {
              let cx = 120,
                cy = 130,
                startX = 280;
              let cH = "#1e293b",
                cB = "#1e293b",
                cL = "#2563eb";
              let sh = Math.max(scaleCS(h), 20),
                sb = Math.max(scaleCS(b), 20),
                stf = Math.max(scaleCS(tf), 12),
                stw = Math.max(scaleCS(tw), 12),
                sl = Math.max(scaleL(l), 80);

              let p = `${cx - sb / 2},${cy - sh / 2} ${cx + sb / 2},${cy - sh / 2} ${cx + sb / 2},${cy - sh / 2 + stf} ${cx + stw / 2},${cy - sh / 2 + stf} ${cx + stw / 2},${cy + sh / 2 - stf} ${cx + sb / 2},${cy + sh / 2 - stf} ${cx + sb / 2},${cy + sh / 2} ${cx - sb / 2},${cy + sh / 2} ${cx - sb / 2},${cy + sh / 2 - stf} ${cx - stw / 2},${cy + sh / 2 - stf} ${cx - stw / 2},${cy - sh / 2 + stf} ${cx - sb / 2},${cy - sh / 2 + stf}`;
              polygon(svg, p, cH, "url(#hatch-pattern)");

              rect(svg, startX, cy - sh / 2, sl, sh, "none", cH);
              line(
                svg,
                startX,
                cy - sh / 2 + stf,
                startX + sl,
                cy - sh / 2 + stf,
                cB,
              );
              line(
                svg,
                startX,
                cy + sh / 2 - stf,
                startX + sl,
                cy + sh / 2 - stf,
                cB,
              );

              dimV(svg, cx - sb / 2 - 25, cy - sh / 2, cy + sh / 2, "H: " + h, cH);
              dimH(
                svg,
                cx - sb / 2,
                cx + sb / 2,
                cy - sh / 2 - 20,
                cy - sh / 2,
                "B: " + b,
                cB,
              );
              dimH(
                svg,
                startX,
                startX + sl,
                cy + sh / 2 + 25,
                cy + sh / 2,
                "L: " + l + " mm",
                cL,
              );
              dimV(
                svg,
                cx + sb / 2 + 15,
                cy - sh / 2,
                cy - sh / 2 + stf,
                "tf: " + tf,
              );
              dimH(svg, cx - stw / 2, cx + stw / 2, cy, null, "tw: " + tw);
            }

            function drawChannelProfile(svg, h, b, tf, tw, l) {
              let cx = 120,
                cy = 130,
                startX = 280;
              let cH = "#1e293b",
                cB = "#1e293b",
                cL = "#2563eb";
              let sh = Math.max(scaleCS(h), 20),
                sb = Math.max(scaleCS(b), 20),
                stf = Math.max(scaleCS(tf), 2),
                stw = Math.max(scaleCS(tw), 2),
                sl = Math.max(scaleL(l), 80);

              let p = `${cx - sb / 2},${cy - sh / 2} ${cx + sb / 2},${cy - sh / 2} ${cx + sb / 2},${cy - sh / 2 + stf} ${cx - sb / 2 + stw},${cy - sh / 2 + stf} ${cx - sb / 2 + stw},${cy + sh / 2 - stf} ${cx + sb / 2},${cy + sh / 2 - stf} ${cx + sb / 2},${cy + sh / 2} ${cx - sb / 2},${cy + sh / 2}`;
              polygon(svg, p, cH, "url(#hatch-pattern)");

              rect(svg, startX, cy - sh / 2, sl, sh, "none", cH);
              line(
                svg,
                startX,
                cy - sh / 2 + stf,
                startX + sl,
                cy - sh / 2 + stf,
                cB,
              );
              line(
                svg,
                startX,
                cy + sh / 2 - stf,
                startX + sl,
                cy + sh / 2 - stf,
                cB,
              );

              let hx = cx - sb / 2 - 25;
              line(svg, hx, cy - sh / 2, hx, cy + sh / 2, cH);
              line(svg, hx - 5, cy - sh / 2, hx + 5, cy - sh / 2, cH);
              line(svg, hx - 5, cy + sh / 2, hx + 5, cy + sh / 2, cH);
              text(svg, hx - 15, cy + 4, "H " + h, "end", cH);

              dimH(
                svg,
                cx - sb / 2,
                cx + sb / 2,
                cy - sh / 2 - 20,
                cy - sh / 2,
                "B: " + b,
                cB,
              );
              dimH(
                svg,
                startX,
                startX + sl,
                cy + sh / 2 + 25,
                cy + sh / 2,
                "L: " + l + " mm",
                cL,
              );

              dimV(
                svg,
                cx + sb / 2 + 15,
                cy - sh / 2,
                cy - sh / 2 + stf,
                "tf: " + tf,
                "#475569",
              );
              dimH(
                svg,
                cx - sb / 2,
                cx - sb / 2 + stw,
                cy + sh / 2 + 15,
                cy + sh / 2,
                "",
                "#475569",
              );
              text(
                svg,
                (cx - sb / 2 + cx - sb / 2 + stw) / 2,
                cy + sh / 2 + 30,
                "tw: " + tw,
                "middle",
                "#475569",
              );
            }

            function rect(svg, x, y, w, h, fill = "none", stroke = "black") {
              let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              r.setAttribute("x", x);
              r.setAttribute("y", y);
              r.setAttribute("width", w);
              r.setAttribute("height", h);
              r.setAttribute("stroke", stroke);
              r.setAttribute("stroke-width", "1.5");
              r.setAttribute("fill", fill);
              svg.appendChild(r);
            }
            function rect_mask(svg, x, y, w, h, fill = "white") {
              let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              r.setAttribute("x", x);
              r.setAttribute("y", y);
              r.setAttribute("width", w);
              r.setAttribute("height", h);
              r.setAttribute("fill", fill);
              r.setAttribute("stroke", "none");
              svg.appendChild(r);
            }
            function circle(svg, cx, cy, r, stroke = "black") {
              let c = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
              );
              c.setAttribute("cx", cx);
              c.setAttribute("cy", cy);
              c.setAttribute("r", r);
              c.setAttribute("stroke", stroke);
              c.setAttribute("stroke-width", "1.5");
              c.setAttribute("fill", "none");
              svg.appendChild(c);
            }
            function polygon(svg, points, stroke = "black", fill = "none") {
              let p = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon",
              );
              p.setAttribute("points", points);
              p.setAttribute("stroke", stroke);
              p.setAttribute("stroke-width", "1.5");
              p.setAttribute("fill", fill);
              svg.appendChild(p);
            }
            function line(svg, x1, y1, x2, y2, color = "black", dash = "") {
              let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
              l.setAttribute("x1", x1);
              l.setAttribute("y1", y1);
              l.setAttribute("x2", x2);
              l.setAttribute("y2", y2);
              l.setAttribute("stroke", color);
              l.setAttribute("stroke-width", "1.3");
              if (dash) l.setAttribute("stroke-dasharray", dash);
              svg.appendChild(l);
            }
            function dimH(svg, x1, x2, y, shaftY, txt, color) {
              if (shaftY !== undefined && shaftY !== null) {
                line(svg, x1, shaftY, x1, y + 2, "#94a3b8", "2,2");
                line(svg, x2, shaftY, x2, y + 2, "#94a3b8", "2,2");
              }
              line(svg, x1, y, x2, y, color);
              line(svg, x1, y - 4, x1, y + 4, color);
              line(svg, x2, y - 4, x2, y + 4, color);
              let tx = (x1 + x2) / 2;
              if (x2 - x1 < 50) tx = x2 + 25;
              text(svg, tx, y - 6, txt, "middle", color);
            }
            function dimV(svg, x, y1, y2, txt, color) {
              line(svg, x, y1, x, y2, color);
              line(svg, x - 5, y1, x + 5, y1, color);
              line(svg, x - 5, y2, x + 5, y2, color);
              text(svg, x + 8, (y1 + y2) / 2 + 4, txt, "start", color);
            }
            function dimV_centered(svg, x, y1, y2, txt, color) {
              line(svg, x, y1, x, y1 + 12, color);
              line(svg, x, y2, x, y2 - 12, color);
              let midY = (y1 + y2) / 2;
              rect_mask(svg, x - 26, midY - 9, 52, 18, "#ffffff");
              text(svg, x, midY + 4, txt, "middle", color);
            }
            function text(svg, x, y, txt, anchor, color) {
              let tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
              tx.setAttribute("x", x);
              tx.setAttribute("y", y);
              tx.setAttribute("font-size", "11");
              tx.setAttribute("font-weight", "600");
              tx.setAttribute("fill", color);
              tx.setAttribute("text-anchor", anchor);
              tx.textContent = txt;
              svg.appendChild(tx);
            }
            function val(id) {
              let el = document.getElementById(id);
              return el ? el.value.trim() : "";
            }

            function clearAllInputs() {
              document
                .querySelectorAll(".control-panel input")
                .forEach((input) => (input.value = ""));

              document.getElementById("screen-company").innerText = "--";
              document.getElementById("screen-workorder").innerText = "--";
              document.getElementById("screen-generatedby").innerText = "--";
              document.getElementById("screen-date").innerText = "--";

              document.getElementById("out-company").innerText = "--";
              document.getElementById("out-workorder").innerText = "--";
              document.getElementById("out-generatedby").innerText = "--";
              document.getElementById("out-date").innerText = "--";

              document.getElementById("report-output").innerHTML = "";
              document.getElementById("svg").innerHTML =
                `<defs><pattern id="hatch-pattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#475569" stroke-width="1"/></pattern></defs>`;

              window.isCanvasPopulated = false;
            }

            /* ==========================================================================
               HIGH-FIDELITY VECTOR BLOB VIRTUAL PRINT EXTRACTION INTERFACE
               ========================================================================== */
           function downloadPDF() {
        // 1. Ensure calculations are run
        if (!window.isCanvasPopulated) {
          processEngineeringCalculations();
        }

        // 2. Validate data
        if (!window.isCanvasPopulated) {
          openSiteModal(
            "Empty Workspace",
            "Please enter geometry parameters and click 'Compute' before generating drawings.",
          );
          return;
        }

        // 3. Prepare print table
        document.getElementById("print-info-table").style.display = "block";

        // 4. Trigger the native print dialog
        // The CSS @media print block defined above will handle the layout
        window.print();
      }
              try {
                let company =
                  document.getElementById("company-name").value.trim() || "--";
                let workOrder =
                  document.getElementById("work-order").value.trim() || "--";
                let engineer =
                  document.getElementById("generated-by").value.trim() || "--";
                let currentTimestamp = new Date().toLocaleDateString();

                let rawSvgNode = document.getElementById("svg");
                let serializedSvg = new XMLSerializer().serializeToString(rawSvgNode);

                let compiledSpecsListHTML = "";
                document
                  .querySelectorAll("#report-output .report-item")
                  .forEach((cardElement) => {
                    let specGroupTitle =
                      cardElement.querySelector("strong").innerText;
                    compiledSpecsListHTML += `<div style="background:#f8fafc; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #64748b;"><strong style="display:block; color:#64748b; font-size:11px; text-transform:uppercase; margin-bottom:4px;">${specGroupTitle}</strong><ul style="margin:0; padding-left:16px; color:#0f172a; font-size:12px;">`;
                    cardElement.querySelectorAll("li").forEach((listItem) => {
                      compiledSpecsListHTML += `<li>${listItem.innerHTML}</li>`;
                    });
                    compiledSpecsListHTML += `</ul></div>`;
                  });

                const printStyles = `
                  <style>
                    @page { size: A4 landscape; margin: 0 !important; }
                    html, body { background:#ffffff; color:#0f172a; margin:0; padding:0; height: 100%; width: 100%; }
                    #drawing-page { page-break-inside:avoid !important; page-break-after:always !important; break-after:page !important; height:100% !important; display:flex !important; flex-direction:column !important; justify-content:space-between !important; box-sizing:border-box !important; padding: 10mm 15mm !important; }
                    .viewport { border:1px solid #94a3b8 !important; padding:8px !important; width:100% !important; background:#ffffff !important; height:52vh !important; max-height:52vh !important; display:flex !important; justify-content:center !important; align-items:center !important; box-sizing:border-box !important; }
                    .viewport svg { width:100% !important; height:100% !important; max-height:48vh !important; }
                    #company-details-block { display:block !important; border:2px solid #0f172a !important; background:#ffffff !important; width:100% !important; margin-top:auto !important; }
                    .report-title { background:#1e293b !important; color:#ffffff !important; padding:5px 8px !important; font-size:11px !important; font-weight:700 !important; text-transform:uppercase !important; }
                    #print-info-table table { width:100% !important; border-collapse:collapse !important; font-size:11px !important; }
                    #print-info-table th, #print-info-table td { border:1px solid #0f172a !important; padding:5px 8px !important; text-align:left !important; color:#000000 !important; }
                    #print-info-table th { background:#f1f5f9 !important; font-weight:700 !important; width:20% !important; }
                    #print-info-table td { width:30% !important; font-weight:600 !important; }
                    #specification-page { page-break-before:always !important; break-before:page !important; margin-top:0 !important; background:transparent !important; padding: 10mm 15mm !important; box-sizing: border-box !important; }
                    #specification-page .report-title-doc { font-size:1.25rem !important; margin-bottom:15px !important; color:#0f172a !important; border-bottom:2px solid #0f172a !important; padding-bottom:4px !important; text-transform:uppercase; font-weight:700 !important; }
                    .report-grid { display:block !important; width:100% !important; }
                  </style>
                `;

                const printBodyHTML = `
                  <div id="drawing-page">
                    <div class="viewport">${serializedSvg}</div>
                    <div id="company-details-block">
                      <div class="report-title">Company Details</div>
                      <div id="print-info-table">
                        <table>
                          <tr><th>Company Name</th><td>${company}</td><th>Work Order Reference</th><td>${workOrder}</td></tr>
                          <tr><th>Generated By</th><td>${engineer}</td><th>Generation Timestamp</th><td>${currentTimestamp}</td></tr>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div id="specification-page">
                    <div class="report-title-doc">Product Specifications</div>
                    <div class="report-grid">${compiledSpecsListHTML}</div>
                  </div>
                `;

                const printHtml = `<!doctype html>
                  <html>
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Production Print</title>
                      ${printStyles}
                    </head>
                    <body>
                      ${printBodyHTML}
                    </body>
                  </html>`;

                const printWin = window.open("", "_blank", "noopener,noreferrer");
                if (!printWin) {
                  openSiteModal(
                    "Popup Blocked",
                    "Your browser blocked opening the print window. Please allow popups for this site, then try again.",
                  );
                  return;
                }

                printWin.document.open();
                printWin.document.write(printHtml);
                printWin.document.close();

                printWin.focus();

                // Try to close after print in the print window.
                printWin.onafterprint = function () {
                  try {
                    printWin.close();
                  } catch (e) {
                    // ignore
                  }
                };

                // Print shortly after content is rendered.
                setTimeout(() => {
                  try {
                    printWin.print();
                  } catch (e) {
                    openSiteModal(
                      "Printing Error",
                      "Unable to trigger the print dialog from the print window. Please try printing manually from the opened window.",
                    );
                  }
                }, 200);
              } catch (err) {
                openSiteModal(
                  "Printing Error",
                  "An error occurred compiling print components: " + err.message,
                );
              }
            }

            document.addEventListener("DOMContentLoaded", function () {
              switchShapeProfile();
            });
    </script>
